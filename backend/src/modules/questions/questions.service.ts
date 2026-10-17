import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const AUTHOR_SELECT = { id: true, name: true, avatarUrl: true };

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByListing(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const questions = await this.prisma.productQuestion.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });
    return { questions };
  }

  async createQuestion(listingId: string, authorId: string, text: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.productQuestion.create({
      data: { listingId, authorId, text },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });
  }

  async createReply(questionId: string, authorId: string, text: string) {
    const question = await this.prisma.productQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const reply = await this.prisma.questionReply.create({
      data: { questionId, authorId, text },
      include: { author: { select: AUTHOR_SELECT } },
    });

    return reply;
  }
}
