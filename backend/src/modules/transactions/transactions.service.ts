import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    userId: string;
    isAdmin: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (!query.isAdmin) {
      where.order = { is: { sellerId: query.userId } };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              listing: { select: { title: true, images: true } },
              buyer: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.transaction.count({ where: where as never }),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            listing: {
              select: { id: true, title: true, images: true, price: true },
            },
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
            payment: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!isAdmin && transaction.order.sellerId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
