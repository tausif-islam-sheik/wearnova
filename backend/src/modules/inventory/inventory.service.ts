import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ListingsService } from '@/modules/listings/listings.service';
import { countHeldUnits, deriveStatus } from '@/modules/listings/stock';

/** 2 or 3 units left. A single unit is the normal state for a one-off item, so it is not "low". */
const LOW_MIN = 2;
const LOW_MAX = 3;
const STALE_DAYS = 90;
const BULK_MAX = 200;

export const INVENTORY_VIEWS = ['all', 'active', 'reserved', 'sold', 'deactivated', 'low', 'stale'] as const;
export type InventoryView = (typeof INVENTORY_VIEWS)[number];

export const BULK_ACTIONS = ['activate', 'deactivate', 'promote', 'unpromote'] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

const staleBefore = () => new Date(Date.now() - STALE_DAYS * 86_400_000);

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
  ) {}

  /** Where-clause for a tab of the inventory table. */
  private whereForView(view: InventoryView): Prisma.ListingWhereInput {
    switch (view) {
      case 'active':
      case 'reserved':
      case 'sold':
      case 'deactivated':
        return { status: view };
      case 'low':
        return { status: 'active', quantity: { gte: LOW_MIN, lte: LOW_MAX } };
      case 'stale':
        return { status: 'active', uploadedAt: { lte: staleBefore() } };
      default:
        return {};
    }
  }

  async getSummary() {
    const [byStatusRows, aging, topCategories, topBrands, topSellers, counts] = await Promise.all([
      this.prisma.$queryRaw<{ status: string; count: number; units: number; value: number }[]>`
        SELECT "status"::text AS status,
               COUNT(*)::int AS count,
               COALESCE(SUM("quantity"), 0)::int AS units,
               COALESCE(SUM("price" * "quantity"), 0)::float AS value
        FROM "Listing" GROUP BY "status"`,
      this.prisma.$queryRaw<{ lt30: number; d30to59: number; d60to89: number; d90plus: number }[]>`
        SELECT COUNT(*) FILTER (WHERE "uploadedAt" > now() - interval '30 days')::int AS "lt30",
               COUNT(*) FILTER (WHERE "uploadedAt" <= now() - interval '30 days' AND "uploadedAt" > now() - interval '60 days')::int AS "d30to59",
               COUNT(*) FILTER (WHERE "uploadedAt" <= now() - interval '60 days' AND "uploadedAt" > now() - interval '90 days')::int AS "d60to89",
               COUNT(*) FILTER (WHERE "uploadedAt" <= now() - interval '90 days')::int AS "d90plus"
        FROM "Listing" WHERE "status" = 'active'`,
      this.prisma.$queryRaw<{ name: string; count: number; value: number }[]>`
        SELECT c."name" AS name, COUNT(*)::int AS count, COALESCE(SUM(l."price" * l."quantity"), 0)::float AS value
        FROM "Listing" l JOIN "Category" c ON c."id" = l."categoryId"
        WHERE l."status" = 'active' GROUP BY c."name" ORDER BY count DESC, value DESC LIMIT 5`,
      this.prisma.$queryRaw<{ name: string; count: number; value: number }[]>`
        SELECT "brand" AS name, COUNT(*)::int AS count, COALESCE(SUM("price" * "quantity"), 0)::float AS value
        FROM "Listing" WHERE "status" = 'active' GROUP BY "brand" ORDER BY count DESC, value DESC LIMIT 5`,
      this.prisma.$queryRaw<{ name: string; count: number; value: number }[]>`
        SELECT u."name" AS name, COUNT(*)::int AS count, COALESCE(SUM(l."price" * l."quantity"), 0)::float AS value
        FROM "Listing" l JOIN "User" u ON u."id" = l."sellerId"
        WHERE l."status" = 'active' GROUP BY u."id", u."name" ORDER BY count DESC, value DESC LIMIT 5`,
      this.getCounts(),
    ]);

    type Bucket = { count: number; units: number; value: number };
    const byStatus: Record<'active' | 'reserved' | 'sold' | 'deactivated', Bucket> = {
      active: { count: 0, units: 0, value: 0 },
      reserved: { count: 0, units: 0, value: 0 },
      sold: { count: 0, units: 0, value: 0 },
      deactivated: { count: 0, units: 0, value: 0 },
    };
    for (const r of byStatusRows) {
      if (r.status in byStatus) {
        byStatus[r.status as keyof typeof byStatus] = { count: r.count, units: r.units, value: r.value };
      }
    }

    return {
      totals: {
        activeListings: byStatus.active.count,
        activeUnits: byStatus.active.units,
        activeValue: byStatus.active.value,
        soldOut: byStatus.sold.count,
        lowStock: counts.low,
        stale: counts.stale,
        byStatus,
      },
      aging: aging[0] ?? { lt30: 0, d30to59: 0, d60to89: 0, d90plus: 0 },
      top: { categories: topCategories, brands: topBrands, sellers: topSellers },
      thresholds: { lowMin: LOW_MIN, lowMax: LOW_MAX, staleDays: STALE_DAYS },
    };
  }

  /** Tab badges for the table. */
  private async getCounts(): Promise<Record<InventoryView, number>> {
    const [grouped, low, stale] = await Promise.all([
      this.prisma.listing.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.listing.count({ where: this.whereForView('low') }),
      this.prisma.listing.count({ where: this.whereForView('stale') }),
    ]);
    const n = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
    return {
      all: grouped.reduce((sum, g) => sum + g._count._all, 0),
      active: n('active'),
      reserved: n('reserved'),
      sold: n('sold'),
      deactivated: n('deactivated'),
      low,
      stale,
    };
  }

  async findItems(query: {
    view?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const view = (INVENTORY_VIEWS as readonly string[]).includes(query.view ?? '')
      ? (query.view as InventoryView)
      : 'all';
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

    const and: Prisma.ListingWhereInput[] = [this.whereForView(view)];
    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { seller: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    const where: Prisma.ListingWhereInput = { AND: and };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { uploadedAt: 'asc' }
        : query.sort === 'stock'
          ? { quantity: 'asc' }
          : query.sort === 'value'
            ? { price: 'desc' }
            : { uploadedAt: 'desc' };

    const [items, total, counts] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: [orderBy, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          images: true,
          brand: true,
          price: true,
          quantity: true,
          status: true,
          isPromoted: true,
          uploadedAt: true,
          category: { select: { name: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      this.prisma.listing.count({ where }),
      this.getCounts(),
    ]);

    return {
      items: items.map(({ images, category, ...rest }) => ({
        ...rest,
        image: images[0] ?? null,
        category: category.name,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts,
    };
  }

  /** Set a listing's stock; the listing service keeps its status in step. */
  async setStock(id: string, quantity: unknown) {
    // Must be an actual number: Number(null) and Number('') are 0, which would zero the stock.
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0 || quantity > 9999) {
      throw new BadRequestException('Stock must be a whole number between 0 and 9999');
    }
    const q = quantity;
    const updated = await this.listings.update(id, { quantity: q });
    return { id: updated.id, title: updated.title, quantity: updated.quantity, status: updated.status };
  }

  /**
   * Apply one action to many listings. Anything unsafe is skipped (and reported) rather than
   * failing the whole batch: held listings are never deactivated, and sold-out ones need a restock.
   */
  async bulk(ids: unknown, action: unknown) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== 'string')) {
      throw new BadRequestException('Select at least one listing');
    }
    if (ids.length > BULK_MAX) throw new BadRequestException(`Select at most ${BULK_MAX} listings at a time`);
    if (!(BULK_ACTIONS as readonly string[]).includes(action as string)) {
      throw new BadRequestException(`action must be one of: ${BULK_ACTIONS.join(', ')}`);
    }
    const act = action as BulkAction;
    const unique = [...new Set(ids as string[])];

    const rows = await this.prisma.listing.findMany({
      where: { id: { in: unique } },
      select: { id: true, title: true, status: true, quantity: true, isPromoted: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    const toUpdate: string[] = [];
    const skipped: { id: string; title: string; reason: string }[] = [];
    for (const id of unique) {
      const row = byId.get(id);
      if (!row) {
        skipped.push({ id, title: id, reason: 'Not found' });
        continue;
      }
      const skip = (reason: string) => skipped.push({ id, title: row.title, reason });
      switch (act) {
        case 'deactivate':
          if (row.status === 'deactivated') skip('Already deactivated');
          else if (row.status === 'reserved') skip('A buyer is checking out');
          else if (row.status === 'sold') skip('Already sold out');
          else toUpdate.push(id);
          break;
        case 'activate':
          if (row.status !== 'deactivated') skip(row.status === 'active' ? 'Already active' : 'Sold out: restock it instead');
          else if (row.quantity === 0) skip('No stock: restock it first');
          else toUpdate.push(id);
          break;
        case 'promote':
          if (row.isPromoted) skip('Already promoted');
          else toUpdate.push(id);
          break;
        case 'unpromote':
          if (!row.isPromoted) skip('Not promoted');
          else toUpdate.push(id);
          break;
      }
    }

    if (toUpdate.length > 0) {
      if (act === 'promote' || act === 'unpromote') {
        await this.prisma.listing.updateMany({
          where: { id: { in: toUpdate } },
          data: { isPromoted: act === 'promote' },
        });
      } else {
        // Status comes from the stock rules, never set blindly.
        await this.prisma.$transaction(async (tx) => {
          for (const id of toUpdate) {
            const row = byId.get(id)!;
            const next =
              act === 'deactivate'
                ? 'deactivated'
                : deriveStatus({
                    status: 'active',
                    quantity: row.quantity,
                    holds: await countHeldUnits(tx, id),
                  });
            await tx.listing.update({ where: { id }, data: { status: next } });
          }
        });
      }
    }
    return { action: act, updated: toUpdate.length, skipped };
  }
}
