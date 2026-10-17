import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/prisma/prisma.service';
import { requireText, slugify } from '@/common/utils/catalog';

export interface BrandInput {
  name?: string;
  slug?: string;
  logoLetter?: string;
}

const brandSelect = {
  id: true,
  name: true,
  slug: true,
  logoLetter: true,
  productCount: true,
  createdAt: true,
} as const;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Brands with a live product count (the stored `productCount` column is not maintained). */
  async findAll() {
    const [brands, counts] = await Promise.all([
      this.prisma.brand.findMany({ orderBy: { name: 'asc' }, select: brandSelect }),
      this.prisma.listing.groupBy({ by: ['brand'], _count: { _all: true } }),
    ]);
    const byName = new Map(counts.map((c) => [c.brand, c._count._all]));
    return brands.map((b) => ({ ...b, productCount: byName.get(b.name) ?? 0 }));
  }

  async create(input: BrandInput) {
    const name = requireText(input.name, 'Name', 80);
    const slug = slugify(input.slug?.trim() || name);
    if (!slug) throw new ConflictException('Could not build a valid slug from that name');
    const logoLetter = (input.logoLetter?.trim() || name).charAt(0).toUpperCase();

    try {
      const brand = await this.prisma.brand.create({
        data: { name, slug, logoLetter },
        select: brandSelect,
      });
      return { ...brand, productCount: 0 };
    } catch (e) {
      throw this.mapUniqueError(e);
    }
  }

  async update(id: string, input: BrandInput) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Brand not found');

    const data: Prisma.BrandUpdateInput = {};
    if (input.name !== undefined) data.name = requireText(input.name, 'Name', 80);
    if (input.slug !== undefined) {
      const slug = slugify(input.slug);
      if (!slug) throw new ConflictException('Slug is not valid');
      data.slug = slug;
    }
    if (input.logoLetter !== undefined) {
      data.logoLetter = (input.logoLetter.trim() || existing.name).charAt(0).toUpperCase();
    }

    try {
      // Listings store the brand as plain text, so a rename has to carry over to them.
      const [brand] = await this.prisma.$transaction([
        this.prisma.brand.update({ where: { id }, data, select: brandSelect }),
        ...(typeof data.name === 'string' && data.name !== existing.name
          ? [
              this.prisma.listing.updateMany({
                where: { brand: existing.name },
                data: { brand: data.name },
              }),
            ]
          : []),
      ]);
      const productCount = await this.prisma.listing.count({ where: { brand: brand.name } });
      return { ...brand, productCount };
    } catch (e) {
      throw this.mapUniqueError(e);
    }
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');

    const inUse = await this.prisma.listing.count({ where: { brand: brand.name } });
    if (inUse > 0) {
      throw new ConflictException(
        `${brand.name} is used by ${inUse} listing${inUse === 1 ? '' : 's'}. Move or delete them first.`,
      );
    }
    await this.prisma.brand.delete({ where: { id } });
    return { id, name: brand.name };
  }

  private mapUniqueError(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('A brand with that name or slug already exists');
    }
    return e;
  }
}
