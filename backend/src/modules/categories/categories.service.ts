import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { requireText, slugify } from '@/common/utils/catalog';

export interface CategoryInput {
  name?: string;
  slug?: string;
  icon?: string | null;
  /** Parent category id, or null / omitted for a top-level category. */
  parentId?: string | null;
}


@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const all = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return this.buildTree(all);
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(input: CategoryInput) {
    const name = requireText(input.name, 'Name', 80);
    const slug = slugify(input.slug?.trim() || name);
    if (!slug) throw new BadRequestException('Could not build a valid slug from that name');

    let parentId: string | null = null;
    if (input.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new BadRequestException('Parent category not found');
      parentId = parent.id;
    }

    // Ids are readable and stable: `parent-id` + `-slug` (top-level ones are just the slug).
    const id = parentId ? `${parentId}-${slug}` : slug;
    if (await this.prisma.category.findUnique({ where: { id } })) {
      throw new ConflictException('A category with that slug already exists here');
    }

    return this.prisma.category.create({
      data: { id, name, slug, icon: input.icon?.trim() || null, parentId },
    });
  }

  async update(id: string, input: CategoryInput) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    const data: { name?: string; slug?: string; icon?: string | null; parentId?: string | null } = {};
    if (input.name !== undefined) data.name = requireText(input.name, 'Name', 80);
    if (input.slug !== undefined) {
      const slug = slugify(input.slug);
      if (!slug) throw new BadRequestException('Slug is not valid');
      data.slug = slug;
    }
    if (input.icon !== undefined) data.icon = input.icon?.trim() || null;

    if (input.parentId !== undefined && input.parentId !== existing.parentId) {
      if (input.parentId) {
        const subtree = await this.subtreeIds(id);
        if (subtree.includes(input.parentId)) {
          throw new BadRequestException('A category cannot be moved inside itself');
        }
        const parent = await this.prisma.category.findUnique({ where: { id: input.parentId } });
        if (!parent) throw new BadRequestException('Parent category not found');
      }
      data.parentId = input.parentId || null;
    }

    const renamed = data.name !== undefined && data.name !== existing.name;
    const [category] = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({ where: { id }, data });
      if (renamed) {
        // Listings keep a copy of the category names in `categoryPath`; keep them in sync.
        const ids = await this.subtreeIds(id);
        const listings = await tx.listing.findMany({
          where: { categoryId: { in: ids } },
          select: { id: true, categoryPath: true },
        });
        for (const l of listings) {
          if (!l.categoryPath.includes(existing.name)) continue;
          await tx.listing.update({
            where: { id: l.id },
            data: { categoryPath: l.categoryPath.map((p) => (p === existing.name ? data.name! : p)) },
          });
        }
      }
      return [updated];
    });
    return category;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, listings: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.children > 0) {
      throw new ConflictException('This category has sub-categories. Delete or move them first.');
    }
    if (category._count.listings > 0) {
      const n = category._count.listings;
      throw new ConflictException(
        `${n} listing${n === 1 ? ' uses' : 's use'} this category. Move or delete them first.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { id, name: category.name };
  }

  /** The category itself plus every descendant. */
  private async subtreeIds(rootId: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const ids = [rootId];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  }

  private buildTree(
    categories: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
      parentId: string | null;
    }[],
  ) {
    const map = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id);
      if (!node) continue;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId);
        if (parent) (parent.children as unknown[]).push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
