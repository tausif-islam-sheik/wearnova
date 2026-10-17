import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

    const where: Record<string, unknown> = {};
    if (query.status === 'open' || query.status === 'resolved') where.status = query.status;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { orderId: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
        { order: { listing: { title: { contains: q, mode: 'insensitive' } } } },
        { order: { buyer: { name: { contains: q, mode: 'insensitive' } } } },
        { order: { seller: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [disputes, total, open, resolved, openCases] = await Promise.all([
      this.prisma.dispute.findMany({
        where: where as never,
        // Oldest open cases first, so nothing waits forever; resolved ones newest first.
        orderBy: query.status === 'resolved' ? { resolvedAt: 'desc' } : { openedAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              listing: { select: { id: true, title: true, images: true } },
              buyer: { select: { id: true, name: true } },
              seller: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.dispute.count({ where: where as never }),
      this.prisma.dispute.count({ where: { status: 'open' } }),
      this.prisma.dispute.count({ where: { status: 'resolved' } }),
      this.prisma.dispute.findMany({
        where: { status: 'open' },
        select: { openedAt: true, order: { select: { total: true } } },
      }),
    ]);

    return {
      disputes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts: { open, resolved, all: open + resolved },
      stats: {
        /** Escrow currently frozen by open disputes. */
        openValue: Math.round(openCases.reduce((sum, d) => sum + d.order.total, 0) * 100) / 100,
        oldestOpen: openCases.length
          ? new Date(Math.min(...openCases.map((d) => d.openedAt.getTime())))
          : null,
      },
    };
  }
}
