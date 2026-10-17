import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  bio: true,
  isSuspended: true,
  createdAt: true,
  lastSeen: true,
  ratingsCount: true,
  avgRating: true,
  followersCount: true,
  followingCount: true,
  location: true,
  verifiedMethods: true,
  badges: true,
  _count: {
    select: {
      listings: { where: { status: 'sold' } },
    },
  },
} as const;

// Everything except contact details: this is what other users and anonymous visitors may see.
const { email: _email, ...publicUserSelect } = userSelect;
void _email;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublicUser(user: { _count?: { listings: number } } & Record<string, unknown>) {
    const { _count, ...rest } = user;
    return { ...rest, itemsSold: _count?.listings ?? 0 };
  }

  async findAll(
    query: { page?: number; limit?: number; search?: string },
    opts: { admin?: boolean } = {},
  ) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const skip = (page - 1) * limit;

    // Only admins may search by (or see) email addresses.
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        ...(opts.admin ? [{ email: { contains: query.search, mode: 'insensitive' } }] : []),
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: opts.admin ? userSelect : publicUserSelect,
      }),
      this.prisma.user.count({ where: where as never }),
    ]);

    return {
      users: users.map((u) => this.toPublicUser(u)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    return this.toPublicUser(
      await this.prisma.user.findUniqueOrThrow({
        where: { id },
        select: publicUserSelect,
      }),
    );
  }

  /** Admin action: block or restore a regular user's access. Admins can't be suspended here. */
  async setSuspended(id: string, suspended: boolean, adminId: string) {
    if (id === adminId) throw new ForbiddenException('You cannot suspend your own account');

    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new ForbiddenException('Admin accounts cannot be suspended');

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: suspended },
      select: userSelect,
    });
  }

  async getFollowers(params: { userId: string; page?: number; limit?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: params.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { follower: { select: publicUserSelect } },
      }),
      this.prisma.follow.count({ where: { followingId: params.userId } }),
    ]);

    return {
      users: users.map((u) => this.toPublicUser(u.follower)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(params: { userId: string; page?: number; limit?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: params.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { following: { select: publicUserSelect } },
      }),
      this.prisma.follow.count({ where: { followerId: params.userId } }),
    ]);

    return {
      users: users.map((u) => this.toPublicUser(u.following)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async follow(targetId: string, requesterId: string) {
    if (targetId === requesterId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: requesterId, followingId: targetId } },
      create: { followerId: requesterId, followingId: targetId },
      update: {},
    });

    await Promise.all([
      this.prisma.user.update({
        where: { id: targetId },
        data: { followersCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: requesterId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    return this.getFollowStatus(targetId, requesterId);
  }

  async unfollow(targetId: string, requesterId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: requesterId, followingId: targetId } },
      select: { id: true },
    });

    if (existing) {
      await Promise.all([
        this.prisma.follow.delete({ where: { id: existing.id } }),
        this.prisma.user.update({
          where: { id: targetId },
          data: { followersCount: { decrement: 1 } },
        }),
        this.prisma.user.update({
          where: { id: requesterId },
          data: { followingCount: { decrement: 1 } },
        }),
      ]);
    }

    return this.getFollowStatus(targetId, requesterId);
  }

  async getFollowStatus(targetId: string, requesterId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: requesterId, followingId: targetId } },
      select: { id: true },
    });
    return { following: Boolean(follow) };
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string) {
    if (id !== requesterId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }
}
