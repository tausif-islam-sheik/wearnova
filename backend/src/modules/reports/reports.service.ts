import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export const REPORT_TARGET_TYPES = ['listing', 'user'] as const;
export const REPORT_REASONS = [
  'counterfeit',
  'not_as_described',
  'damaged',
  'inappropriate',
  'other',
] as const;
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;

type TargetType = (typeof REPORT_TARGET_TYPES)[number];
type Reason = (typeof REPORT_REASONS)[number];
type Status = (typeof REPORT_STATUSES)[number];

export interface CreateReportInput {
  targetType?: string;
  targetId?: string;
  reason?: string;
  description?: string;
}

export interface UpdateReportInput {
  status?: string;
  note?: string;
  /** Optional side effect when closing a listing report. */
  deactivateListing?: boolean;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** A signed-in user flags a listing or another user for the moderators. */
  async create(reporterId: string, input: CreateReportInput) {
    const targetType = input.targetType as TargetType;
    if (!REPORT_TARGET_TYPES.includes(targetType)) {
      throw new BadRequestException(`targetType must be one of: ${REPORT_TARGET_TYPES.join(', ')}`);
    }
    const reason = input.reason as Reason;
    if (!REPORT_REASONS.includes(reason)) {
      throw new BadRequestException(`reason must be one of: ${REPORT_REASONS.join(', ')}`);
    }
    if (typeof input.targetId !== 'string' || !input.targetId) {
      throw new BadRequestException('targetId is required');
    }
    const description = input.description?.trim() || null;
    if (description && description.length > 500) {
      throw new BadRequestException('description must be at most 500 characters');
    }

    if (targetType === 'listing') {
      const listing = await this.prisma.listing.findUnique({
        where: { id: input.targetId },
        select: { sellerId: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.sellerId === reporterId) {
        throw new ForbiddenException('You cannot report your own listing');
      }
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: input.targetId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('User not found');
      if (user.id === reporterId) throw new ForbiddenException('You cannot report yourself');
    }

    const duplicate = await this.prisma.report.findFirst({
      where: { reporterId, targetType, targetId: input.targetId, status: 'open' },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('You have already reported this. We are reviewing it.');

    const report = await this.prisma.report.create({
      data: { reporterId, targetType, targetId: input.targetId, reason, description },
      select: { id: true, status: true, createdAt: true },
    });
    return report;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    reason?: string;
    search?: string;
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.reason && query.reason !== 'all') where.reason = query.reason;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { reporter: { name: { contains: q, mode: 'insensitive' } } },
        { reporter: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [reports, total, grouped] = await Promise.all([
      this.prisma.report.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.report.count({ where: where as never }),
      this.prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const counts = { open: 0, resolved: 0, dismissed: 0 } as Record<Status, number>;
    for (const g of grouped) {
      if (g.status in counts) counts[g.status as Status] = g._count._all;
    }

    return {
      reports: await this.withTargets(reports),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts,
    };
  }

  /** Close (resolve / dismiss) or reopen a report, optionally deactivating the reported listing. */
  async update(id: string, adminId: string, input: UpdateReportInput) {
    const status = input.status as Status;
    if (!REPORT_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of: ${REPORT_STATUSES.join(', ')}`);
    }
    const note = input.note?.trim() || null;
    if (note && note.length > 500) {
      throw new BadRequestException('note must be at most 500 characters');
    }

    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    const closing = status !== 'open';
    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.deactivateListing && closing) {
        if (report.targetType !== 'listing') {
          throw new BadRequestException('Only listing reports can deactivate a listing');
        }
        await tx.listing.updateMany({
          where: { id: report.targetId, status: { not: 'sold' } },
          data: { status: 'deactivated' },
        });
      }
      return tx.report.update({
        where: { id },
        data: {
          status,
          resolutionNote: closing ? note : null,
          resolvedAt: closing ? new Date() : null,
          resolvedById: closing ? adminId : null,
        },
        include: { reporter: { select: { id: true, name: true, email: true } } },
      });
    });

    const [withTarget] = await this.withTargets([updated]);
    return withTarget;
  }

  /** Attach a small summary of what each report points at (listing or user). */
  private async withTargets<T extends { targetType: string; targetId: string }>(reports: T[]) {
    const listingIds = reports.filter((r) => r.targetType === 'listing').map((r) => r.targetId);
    const userIds = reports.filter((r) => r.targetType === 'user').map((r) => r.targetId);

    const [listings, users] = await Promise.all([
      listingIds.length
        ? this.prisma.listing.findMany({
            where: { id: { in: listingIds } },
            select: {
              id: true,
              title: true,
              images: true,
              status: true,
              price: true,
              seller: { select: { id: true, name: true } },
            },
          })
        : [],
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, isSuspended: true, avatarUrl: true },
          })
        : [],
    ]);

    const listingMap = new Map(listings.map((l) => [l.id, l]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return reports.map((r) => {
      if (r.targetType === 'listing') {
        const l = listingMap.get(r.targetId);
        return {
          ...r,
          target: l
            ? {
                type: 'listing' as const,
                id: l.id,
                title: l.title,
                image: l.images?.[0] ?? null,
                status: l.status,
                price: l.price,
                sellerId: l.seller.id,
                sellerName: l.seller.name,
              }
            : null,
        };
      }
      const u = userMap.get(r.targetId);
      return {
        ...r,
        target: u
          ? {
              type: 'user' as const,
              id: u.id,
              title: u.name,
              email: u.email,
              image: u.avatarUrl,
              suspended: u.isSuspended,
            }
          : null,
      };
    });
  }
}
