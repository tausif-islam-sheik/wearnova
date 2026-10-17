import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Condition, ListingStatus } from '@/generated/client';
import { countHeldUnits, deriveStatus } from './stock';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    categoryId?: string;
    brand?: string;
    sellerId?: string;
    status?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sort?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 30, 500);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.status) {
      if (query.status !== 'all') where.status = query.status;
    } else {
      where.status = 'active';
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brand) {
      where.brand = query.brand;
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    if (query.condition) {
      where.condition = query.condition;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined)
        (where.price as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice !== undefined)
        (where.price as Record<string, number>).lte = query.maxPrice;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Record<string, string> = { uploadedAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (query.sort === 'oldest') orderBy = { uploadedAt: 'asc' };
    else if (query.sort === 'popular') orderBy = { likesCount: 'desc' };

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: where as never,
        orderBy,
        skip,
        take: limit,
        include: { seller: { select: { avgRating: true, ratingsCount: true } } },
      }),
      this.prisma.listing.count({ where: where as never }),
    ]);

    return {
      listings: rows.map(({ seller, ...listing }) => ({
        ...listing,
        sellerRating: seller.avgRating,
        sellerReviews: seller.ratingsCount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async create(data: Record<string, unknown>) {
    const required = [
      'title',
      'description',
      'price',
      'brand',
      'size',
      'condition',
      'sellerId',
      'categoryId',
    ];
    for (const field of required) {
      if (!data[field]) throw new BadRequestException(`Missing required field: ${field}`);
    }

    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId as string },
    });
    if (!category) throw new BadRequestException('Category not found');

    const categoryPath = [category.slug];
    const parent = category.parentId
      ? await this.prisma.category.findUnique({ where: { id: category.parentId } })
      : null;
    if (parent) categoryPath.unshift(parent.slug);

    // `null` (which validation lets through as "absent") must not become 0.
    const quantity = data.quantity == null ? 1 : Number(data.quantity);

    const listing = await this.prisma.listing.create({
      data: {
        title: data.title as string,
        description: data.description as string,
        price: Number(data.price),
        brand: data.brand as string,
        size: data.size as string,
        condition: data.condition as Condition,
        material: (data.material as string) ?? null,
        color: (data.color as string) ?? null,
        pattern: (data.pattern as string) ?? null,
        images: (data.images as string[]) ?? [],
        sellerId: data.sellerId as string,
        categoryId: data.categoryId as string,
        categoryPath,
        quantity,
        status: deriveStatus({
          status: data.status === 'deactivated' ? 'deactivated' : 'active',
          quantity,
          holds: 0,
        }),
        isPromoted: (data.isPromoted as boolean) ?? false,
        shippingFree: (data.shippingFree as boolean) ?? false,
      },
    });
    return listing;
  }

  async update(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');

    const updateData: Record<string, unknown> = {};
    const fields = [
      'title',
      'description',
      'price',
      'brand',
      'size',
      'condition',
      'material',
      'color',
      'pattern',
      'images',
      'isPromoted',
      'shippingFree',
      'categoryId',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    // Stock and status move together: status is derived from the units left (and units held by
    // checkouts in progress), so it can't contradict the stock.
    // "sold" and "reserved" are derived states. A form that simply echoes the current one back is
    // not asking for a change, so it must not override a restock or trip the checks below.
    const requested =
      (data.status === 'sold' || data.status === 'reserved') && data.status === existing.status
        ? undefined
        : data.status;
    if (requested === 'reserved') {
      throw new BadRequestException('Reserved is set automatically while a buyer is checking out.');
    }
    let quantity = existing.quantity;
    if (data.quantity != null) quantity = Number(data.quantity);
    if (requested === 'sold') quantity = 0; // "mark as sold" means sold out
    if (requested === 'active' && quantity === 0) {
      throw new BadRequestException('Set a stock of at least 1 to put this item back on sale.');
    }
    // Only touch stock/status when this edit actually changes one of them: renaming a listing
    // must never flip its status as a side effect.
    if (quantity !== existing.quantity || requested !== undefined) {
      const base: ListingStatus =
        requested === 'deactivated' || (existing.status === 'deactivated' && requested !== 'active')
          ? 'deactivated'
          : 'active';
      updateData.quantity = quantity;
      updateData.status = deriveStatus({
        status: base,
        quantity,
        holds: await countHeldUnits(this.prisma, id),
      });
    }

    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId as string },
      });
      if (!category) throw new BadRequestException('Category not found');
      const categoryPath = [category.slug];
      const parent = category.parentId
        ? await this.prisma.category.findUnique({ where: { id: category.parentId } })
        : null;
      if (parent) categoryPath.unshift(parent.slug);
      updateData.categoryPath = categoryPath;
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: updateData as never,
    });
    return listing;
  }

  async remove(id: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    await this.prisma.listing.delete({ where: { id } });
    return { message: 'Listing deleted' };
  }
}
