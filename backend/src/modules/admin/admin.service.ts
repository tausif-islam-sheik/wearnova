import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';

const GENERAL_KEYS = {
  platformName: 'general_platform_name',
  supportEmail: 'general_support_email',
} as const;

const GENERAL_DEFAULTS = {
  platformName: 'Wearnova',
  supportEmail: 'support@Wearnova.com',
};

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 731;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Platform settings
  // ---------------------------------------------------------------------------

  /**
   * Everything the dashboard shows beyond the headline numbers: what needs attention, where the
   * money is, how orders are flowing, who sells and what sells, and what admins did lately.
   */
  async getDashboard() {
    const staleBefore = new Date(Date.now() - 90 * DAY_MS);
    const ESCROW = ['PAID_ESCROW', 'SHIPPED', 'DELIVERED_CONFIRMED', 'DISPUTED'];

    const [money, pipeline, topSellers, topCategories, activity, disputes, reports, toShip, shipped, stale] =
      await Promise.all([
        this.prisma.$queryRaw<
          { fees: number; payouts: number; escrow: number; escrowOrders: number; refunded: number; refundedOrders: number }[]
        >`
          SELECT
            COALESCE(SUM(p."platformFeeAmount") FILTER (WHERE o."status" = 'RELEASED_TO_SELLER'), 0)::float AS fees,
            COALESCE(SUM(p."sellerPayoutAmount") FILTER (WHERE o."status" = 'RELEASED_TO_SELLER'), 0)::float AS payouts,
            COALESCE(SUM(p."amount") FILTER (WHERE p."status" = 'captured' AND o."status"::text = ANY(${ESCROW})), 0)::float AS escrow,
            (COUNT(*) FILTER (WHERE p."status" = 'captured' AND o."status"::text = ANY(${ESCROW})))::int AS "escrowOrders",
            COALESCE(SUM(p."amount") FILTER (WHERE p."status" = 'refunded'), 0)::float AS refunded,
            (COUNT(*) FILTER (WHERE p."status" = 'refunded'))::int AS "refundedOrders"
          FROM "Payment" p JOIN "Order" o ON o."id" = p."orderId"`,
        this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.$queryRaw<{ id: string; name: string; revenue: number; orders: number }[]>`
          SELECT u."id", u."name", COALESCE(SUM(o."total"), 0)::float AS revenue, COUNT(*)::int AS orders
          FROM "Order" o JOIN "User" u ON u."id" = o."sellerId"
          WHERE o."status" = 'RELEASED_TO_SELLER'
          GROUP BY u."id", u."name" ORDER BY revenue DESC LIMIT 5`,
        this.prisma.$queryRaw<{ name: string; revenue: number; orders: number }[]>`
          SELECT c."name", COALESCE(SUM(o."total"), 0)::float AS revenue, COUNT(*)::int AS orders
          FROM "Order" o
            JOIN "Listing" l ON l."id" = o."listingId"
            JOIN "Category" c ON c."id" = l."categoryId"
          WHERE o."status" = 'RELEASED_TO_SELLER'
          GROUP BY c."name" ORDER BY revenue DESC LIMIT 5`,
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, actorEmail: true, action: true, summary: true, createdAt: true },
        }),
        this.prisma.dispute.findMany({
          where: { status: 'open' },
          select: { openedAt: true, order: { select: { total: true } } },
        }),
        this.prisma.report.aggregate({ where: { status: 'open' }, _count: { _all: true }, _min: { createdAt: true } }),
        this.prisma.order.aggregate({ where: { status: 'PAID_ESCROW' }, _count: { _all: true }, _min: { updatedAt: true } }),
        this.prisma.order.count({ where: { status: 'SHIPPED' } }),
        this.prisma.listing.count({ where: { status: 'active', uploadedAt: { lte: staleBefore } } }),
      ]);

    const dollars = (n: number) => Math.round(n * 100) / 100;
    const m = money[0] ?? { fees: 0, payouts: 0, escrow: 0, escrowOrders: 0, refunded: 0, refundedOrders: 0 };
    const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

    return {
      attention: {
        disputes: {
          open: disputes.length,
          value: dollars(disputes.reduce((sum, d) => sum + d.order.total, 0)),
          oldest: disputes.length ? new Date(Math.min(...disputes.map((d) => d.openedAt.getTime()))).toISOString() : null,
        },
        reports: { open: reports._count._all, oldest: iso(reports._min.createdAt) },
        toShip: { count: toShip._count._all, oldest: iso(toShip._min.updatedAt) },
        awaitingConfirmation: shipped,
        staleListings: stale,
      },
      finance: {
        platformEarnings: dollars(m.fees / 100),
        paidOut: dollars(m.payouts / 100),
        heldInEscrow: dollars(m.escrow / 100),
        escrowOrders: m.escrowOrders,
        refunded: dollars(m.refunded / 100),
        refundedOrders: m.refundedOrders,
      },
      pipeline: Object.fromEntries(pipeline.map((p) => [p.status, p._count._all])),
      topSellers: topSellers.map((s) => ({ ...s, revenue: dollars(s.revenue) })),
      topCategories: topCategories.map((c) => ({ ...c, revenue: dollars(c.revenue) })),
      recentActivity: activity,
    };
  }

  /** Work waiting for an admin: drives the sidebar badges and the notification bell. */
  async getPending() {
    const [reports, disputes] = await Promise.all([
      this.prisma.report.aggregate({
        where: { status: 'open' },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      this.prisma.dispute.aggregate({
        where: { status: 'open' },
        _count: { _all: true },
        _min: { openedAt: true },
      }),
    ]);
    return {
      reports: { open: reports._count._all, oldest: reports._min.createdAt },
      disputes: { open: disputes._count._all, oldest: disputes._min.openedAt },
    };
  }

  async getPlatformSettings() {
    const rows = await this.prisma.platformSetting.findMany({
      where: { key: { in: ['platform_fee_percent', ...Object.values(GENERAL_KEYS)] } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const fee = byKey.get('platform_fee_percent');
    return {
      platformFeePercent: fee !== undefined ? Number(fee) : this.config.platformFeePercentDefault,
      platformName: byKey.get(GENERAL_KEYS.platformName) ?? GENERAL_DEFAULTS.platformName,
      supportEmail: byKey.get(GENERAL_KEYS.supportEmail) ?? GENERAL_DEFAULTS.supportEmail,
    };
  }

  async updateGeneralSettings(input: { platformName?: string; supportEmail?: string }) {
    const platformName = typeof input.platformName === 'string' ? input.platformName.trim() : '';
    if (platformName.length < 2 || platformName.length > 60) {
      throw new BadRequestException('Platform name must be between 2 and 60 characters');
    }
    const supportEmail = typeof input.supportEmail === 'string' ? input.supportEmail.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) || supportEmail.length > 120) {
      throw new BadRequestException('Enter a valid support email address');
    }
    const values = { platformName, supportEmail };
    await this.prisma.$transaction(
      (Object.keys(GENERAL_KEYS) as (keyof typeof GENERAL_KEYS)[]).map((field) =>
        this.prisma.platformSetting.upsert({
          where: { key: GENERAL_KEYS[field] },
          create: { key: GENERAL_KEYS[field], value: values[field] },
          update: { value: values[field] },
        }),
      ),
    );
    return values;
  }

  async updatePlatformFeePercent(percent: number) {
    if (Number.isNaN(percent) || percent < 0 || percent > 50) {
      throw new BadRequestException('Platform fee percent must be between 0 and 50');
    }
    await this.prisma.platformSetting.upsert({
      where: { key: 'platform_fee_percent' },
      create: { key: 'platform_fee_percent', value: String(percent) },
      update: { value: String(percent) },
    });
    return { platformFeePercent: percent };
  }

  async getStats(period: 'week' | 'month' | 'year' = 'month') {
    const [users, listings, orders, orderStats, recentOrders, listingStats] = await Promise.all([
      this.prisma.user.count({ where: { role: 'user' } }),
      this.prisma.listing.count(),
      this.prisma.order.count(),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, price: true } },
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      this.prisma.listing.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const completedRevenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'RELEASED_TO_SELLER' },
    });

    const orderStatusMap: Record<string, number> = {};
    for (const s of orderStats) {
      orderStatusMap[s.status] = s._count;
    }

    const listingStatusMap: Record<string, number> = {};
    for (const s of listingStats) {
      listingStatusMap[s.status] = s._count;
    }

    const monthlyRevenueData = await this.getMonthlyRevenue();
    const revenueSeriesData = await this.getRevenueSeries(period);

    return {
      users,
      listings,
      orders,
      orderStats: {
        total: orders,
        pendingPayment: orderStatusMap.PENDING_PAYMENT ?? 0,
        paidEscrow: orderStatusMap.PAID_ESCROW ?? 0,
        shipped: orderStatusMap.SHIPPED ?? 0,
        deliveredConfirmed: orderStatusMap.DELIVERED_CONFIRMED ?? 0,
        disputed: orderStatusMap.DISPUTED ?? 0,
        released: orderStatusMap.RELEASED_TO_SELLER ?? 0,
        refunded: orderStatusMap.REFUNDED ?? 0,
        cancelled: orderStatusMap.CANCELLED ?? 0,
        revenue: completedRevenue._sum.total ?? 0,
      },
      recentOrders,
      monthlyRevenue: monthlyRevenueData,
      revenueSeries: revenueSeriesData,
      listingStats: {
        active: listingStatusMap.active ?? 0,
        sold: listingStatusMap.sold ?? 0,
        reserved: listingStatusMap.reserved ?? 0,
        deactivated: listingStatusMap.deactivated ?? 0,
      },
    };
  }

  private async getMonthlyRevenue(): Promise<{ month: string; revenue: number; orders: number }[]> {
    const result = await this.prisma.$queryRaw<
      { month: string; revenue: number; orders: bigint }[]
    >`
      SELECT
        TO_CHAR("createdAt", 'Mon') AS month,
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE status = 'RELEASED_TO_SELLER'
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY MIN("createdAt")
    `;
    return result.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
  }

  /**
   * Revenue for the dashboard chart. `period` is week / month / year, or `custom` with an
   * inclusive `from` and `to` (YYYY-MM-DD). A custom range is bucketed by its length (days up to
   * 31, weeks up to 180, months beyond) and empty buckets are kept so gaps are visible.
   */
  async getRevenue(period?: string, from?: string, to?: string) {
    if (period !== 'custom') {
      const normalized = period === 'week' || period === 'year' ? period : 'month';
      return { series: await this.getRevenueSeries(normalized), range: null };
    }

    const start = this.parseDay(from, 'Start date');
    const end = this.parseDay(to, 'End date');
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('Start date must be on or before the end date');
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (end.getTime() > today.getTime()) {
      throw new BadRequestException("End date can't be in the future");
    }
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
    if (days > MAX_RANGE_DAYS) {
      throw new BadRequestException(`Choose a range of at most ${MAX_RANGE_DAYS} days`);
    }

    const bucket: 'day' | 'week' | 'month' = days <= 31 ? 'day' : days <= 180 ? 'week' : 'month';
    const toExclusive = new Date(end.getTime() + DAY_MS);
    const rows = await this.prisma.$queryRaw<{ bucket: Date; revenue: number; orders: bigint }[]>`
      SELECT date_trunc(${bucket}, "createdAt") AS bucket,
             COALESCE(SUM(total), 0)::float AS revenue,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE status = 'RELEASED_TO_SELLER'
        AND "createdAt" >= ${start}
        AND "createdAt" < ${toExclusive}
      GROUP BY bucket`;

    const byStart = new Map(
      rows.map((r) => [r.bucket.toISOString().slice(0, 10), { revenue: Number(r.revenue), orders: Number(r.orders) }]),
    );

    // Walk every bucket in the range (aligned like Postgres: weeks start on Monday).
    const cursor = new Date(start);
    if (bucket === 'week') cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
    if (bucket === 'month') cursor.setUTCDate(1);
    const series: { label: string; revenue: number; orders: number }[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;
    while (cursor.getTime() < toExclusive.getTime()) {
      const hit = byStart.get(cursor.toISOString().slice(0, 10)) ?? { revenue: 0, orders: 0 };
      const revenue = Math.round(hit.revenue * 100) / 100;
      series.push({ label: this.bucketLabel(cursor, bucket), revenue, orders: hit.orders });
      totalRevenue += revenue;
      totalOrders += hit.orders;
      if (bucket === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
      else if (bucket === 'week') cursor.setUTCDate(cursor.getUTCDate() + 7);
      else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return {
      series,
      range: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        days,
        bucket,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
      },
    };
  }

  private parseDay(value: string | undefined, label: string): Date {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${label} must be a date like 2026-10-17`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException(`${label} is not a valid date`);
    }
    return date;
  }

  private bucketLabel(date: Date, bucket: 'day' | 'week' | 'month'): string {
    const month = MONTHS[date.getUTCMonth()];
    if (bucket === 'month') return `${month} '${String(date.getUTCFullYear()).slice(2)}`;
    return `${date.getUTCDate()} ${month}`;
  }

  private async getRevenueSeries(
    period: 'week' | 'month' | 'year',
  ): Promise<{ label: string; revenue: number; orders: number }[]> {
    const since = new Date();
    if (period === 'week') since.setDate(since.getDate() - 7);
    else if (period === 'month') since.setMonth(since.getMonth() - 12);
    else since.setFullYear(since.getFullYear() - 10);

    const unit = period === 'week' ? 'day' : period === 'month' ? 'month' : 'year';

    // Group by the real bucket start, not its label: grouping by "Oct" would merge two Octobers.
    const rows = await this.prisma.$queryRaw<{ bucket: Date; revenue: number; orders: bigint }[]>`
      SELECT bucket,
             COALESCE(SUM(total), 0)::float AS revenue,
             COUNT(*)::bigint AS orders
      FROM (
        SELECT date_trunc(${unit}, "createdAt") AS bucket, total
        FROM "Order"
        WHERE status = 'RELEASED_TO_SELLER' AND "createdAt" >= ${since}
      ) t
      GROUP BY bucket
      ORDER BY bucket`;
    return rows.map((r) => ({
      label:
        period === 'week'
          ? WEEKDAYS[r.bucket.getUTCDay()]!
          : period === 'month'
            ? MONTHS[r.bucket.getUTCMonth()]!
            : String(r.bucket.getUTCFullYear()),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
  }

  async getAnalytics() {
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      totalListings,
      listingsThisMonth,
      listingsLastMonth,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      orderStats,
      listingStatuses,
      completedRevenue,
      monthlyRevenue,
      revenueThisMonth,
      revenueLastMonth,
      topBrands,
      topCategories,
      recentTransactions,
    ] = await Promise.all([
      // total users
      this.prisma.user.count({ where: { role: 'user' } }),
      // users this month
      this.prisma.user.count({ where: { role: 'user', createdAt: { gte: firstOfThisMonth } } }),
      // users last month
      this.prisma.user.count({
        where: { role: 'user', createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } },
      }),
      // total listings
      this.prisma.listing.count(),
      // listings this month
      this.prisma.listing.count({ where: { uploadedAt: { gte: firstOfThisMonth } } }),
      // listings last month
      this.prisma.listing.count({
        where: { uploadedAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } },
      }),
      // total orders
      this.prisma.order.count(),
      // orders this month
      this.prisma.order.count({ where: { createdAt: { gte: firstOfThisMonth } } }),
      // orders last month
      this.prisma.order.count({
        where: { createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } },
      }),
      // order stats by status
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      // listing statuses
      this.prisma.listing.groupBy({ by: ['status'], _count: true }),
      // completed revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'RELEASED_TO_SELLER' },
      }),
      // monthly revenue trend
      this.getMonthlyRevenue(),
      // revenue this month
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: firstOfThisMonth }, status: 'RELEASED_TO_SELLER' },
      }),
      // revenue last month
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth },
          status: 'RELEASED_TO_SELLER',
        },
      }),
      // top brands
      this.prisma.listing.groupBy({
        by: ['brand'],
        _count: true,
        orderBy: { _count: { brand: 'desc' } },
        take: 10,
      }),
      // top categories
      this.prisma.$queryRaw<{ name: string; count: bigint }[]>`
        SELECT c.name, COUNT(*)::bigint AS count
        FROM "Listing" l
        JOIN "Category" c ON c.id = l."categoryId"
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 10
      `,
      // recent transactions
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { date: 'desc' },
      }),
    ]);

    const orderStatusMap: Record<string, number> = {};
    for (const s of orderStats) orderStatusMap[s.status] = s._count;

    const listingStatusMap: Record<string, number> = {};
    for (const s of listingStatuses) listingStatusMap[s.status] = s._count;

    const totalRevenue = completedRevenue._sum.total ?? 0;
    const revThisMonth = revenueThisMonth._sum.total ?? 0;
    const revLastMonth = revenueLastMonth._sum.total ?? 0;

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      summary: {
        totalUsers,
        newUsersThisMonth: usersThisMonth,
        userGrowth: calcGrowth(usersThisMonth, usersLastMonth),
        totalListings,
        newListingsThisMonth: listingsThisMonth,
        listingGrowth: calcGrowth(listingsThisMonth, listingsLastMonth),
        totalOrders,
        orderGrowth: calcGrowth(ordersThisMonth, ordersLastMonth),
        totalRevenue,
        revenueGrowth: calcGrowth(revThisMonth, revLastMonth),
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      trends: {
        monthlyRevenue,
      },
      ordersByStatus: Object.entries(orderStatusMap).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      })),
      revenueByStatus: Object.entries(orderStatusMap).map(([status]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: status === 'RELEASED_TO_SELLER' ? totalRevenue : 0,
      })),
      listingStatus: Object.entries(listingStatusMap).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      })),
      topBrands: topBrands.map((b) => ({ name: b.brand, count: b._count })),
      topCategories: topCategories.map((c) => ({ name: c.name, count: Number(c.count) })),
      recentTransactions,
      newUsersTrend: usersThisMonth,
      newListingsTrend: listingsThisMonth,
    };
  }
}
