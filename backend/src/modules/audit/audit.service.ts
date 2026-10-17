import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { AuditContext, AuditSpec } from './audited.decorator';

/** Filter categories shown in the admin UI, mapped to action prefixes. */
export const AUDIT_CATEGORIES: Record<string, string[]> = {
  orders: ['order.'],
  users: ['user.'],
  catalog: ['listing.', 'brand.', 'category.', 'banner.'],
  moderation: ['report.', 'review.'],
  promos: ['promo.'],
  settings: ['settings.'],
  account: ['account.'],
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes one row for a handler that just succeeded. Never throws: an audit failure must not
   * break (or slow down) the admin action itself.
   */
  async recordFor(spec: AuditSpec, ctx: AuditContext): Promise<void> {
    try {
      const actor = spec.actor ? spec.actor(ctx) : ctx.req.user;
      if (!actor?.id) return;

      const targetId = spec.target ? spec.target(ctx) : ctx.req.params?.id;
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action: spec.action,
          targetType: spec.targetType,
          targetId: targetId ?? null,
          summary: spec.summary(ctx).slice(0, 300),
        },
      });
    } catch (e) {
      this.logger.warn(`Could not record ${spec.action}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    actorId?: string;
    search?: string;
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);

    const and: Record<string, unknown>[] = [];
    const prefixes = query.category ? AUDIT_CATEGORIES[query.category] : undefined;
    if (prefixes) and.push({ OR: prefixes.map((p) => ({ action: { startsWith: p } })) });
    if (query.actorId) and.push({ actorId: query.actorId });
    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { summary: { contains: q, mode: 'insensitive' } },
          { actorEmail: { contains: q, mode: 'insensitive' } },
          { action: { contains: q, mode: 'insensitive' } },
          { targetId: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    const where = and.length ? { AND: and } : {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const [logs, total, allTime, today, lastWeek, admins] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: where as never }),
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.auditLog.groupBy({ by: ['actorId'], where: { createdAt: { gte: weekAgo } } }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      // Whole-log figures, independent of the current filter.
      stats: { total: allTime, today, last7Days: lastWeek, activeAdmins: admins.length },
    };
  }
}
