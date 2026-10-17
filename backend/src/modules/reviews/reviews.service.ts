import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySeller(sellerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: sellerId, hidden: false },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
    return { reviews };
  }

  async checkEligibility(reviewerId: string, sellerId: string) {
    if (reviewerId === sellerId) return { eligible: false, reason: 'You cannot review yourself' };

    const existing = await this.prisma.review.findFirst({
      where: { reviewerId, revieweeId: sellerId },
    });
    if (existing) return { eligible: false, reason: 'You already reviewed this seller' };

    const completedOrder = await this.prisma.order.findFirst({
      where: {
        buyerId: reviewerId,
        sellerId,
        status: 'RELEASED_TO_SELLER',
      },
    });
    if (!completedOrder)
      return { eligible: false, reason: 'No completed purchases from this seller' };

    return { eligible: true, orderId: completedOrder.id };
  }

  async create(reviewerId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { review: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== reviewerId) throw new ForbiddenException('This order is not yours');
    if (order.status !== 'RELEASED_TO_SELLER')
      throw new BadRequestException('Order is not completed');
    if (order.review) throw new BadRequestException('Order already has a review');

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        reviewerId,
        revieweeId: order.sellerId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await this.recalculateSellerRating(order.sellerId);

    return review;
  }

  /** The seller's rating only counts reviews that are visible. */
  private async recalculateSellerRating(sellerId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { revieweeId: sellerId, hidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.user.update({
      where: { id: sellerId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        ratingsCount: stats._count,
      },
    });
  }

  /** Admin: every review (including hidden ones) with filters and paging. */
  async findAllForAdmin(query: {
    page?: number;
    limit?: number;
    visibility?: string;
    rating?: number;
    search?: string;
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

    const where: Record<string, unknown> = {};
    if (query.visibility === 'visible') where.hidden = false;
    if (query.visibility === 'hidden') where.hidden = true;
    if (query.rating && query.rating >= 1 && query.rating <= 5) where.rating = query.rating;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { reviewer: { name: { contains: q, mode: 'insensitive' } } },
        { reviewee: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total, hiddenCount, allCount, avg] = await Promise.all([
      this.prisma.review.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          reviewee: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where: where as never }),
      this.prisma.review.count({ where: { hidden: true } }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true } }),
    ]);

    return {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts: { all: allCount, hidden: hiddenCount, visible: allCount - hiddenCount },
      /** Average star rating across visible reviews, or null when there are none. */
      average: avg._avg.rating === null ? null : Math.round(avg._avg.rating * 10) / 10,
    };
  }

  /** Admin: hide or restore a review, keeping the seller's rating in step. */
  async setHidden(id: string, hidden: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.review.update({
      where: { id },
      data: { hidden },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });
    await this.recalculateSellerRating(review.revieweeId);
    return updated;
  }
}
