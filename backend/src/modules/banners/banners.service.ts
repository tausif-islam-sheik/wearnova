import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const banners = await this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
    return banners.map((b) => ({
      ...b,
      imageUrl: b.imageUrl || null,
      body: b.body || null,
      active: b.status === 'active',
    }));
  }

  async create(dto: CreateBannerDto) {
    const maxOrder = await this.prisma.banner.aggregate({ _max: { order: true } });
    const order = dto.order ?? (maxOrder._max.order ?? 0) + 1;

    const banner = await this.prisma.banner.create({
      data: {
        title: dto.title,
        body: dto.body ?? '',
        imageUrl: dto.imageUrl ?? '',

        order,
        status: dto.active !== false ? 'active' : 'inactive',
      },
    });

    return { ...banner, active: banner.status === 'active' };
  }

  async update(id: string, dto: UpdateBannerDto) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.active !== undefined) data.status = dto.active ? 'active' : 'inactive';

    const banner = await this.prisma.banner.update({ where: { id }, data });
    return { ...banner, active: banner.status === 'active' };
  }

  async remove(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found');

    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner deleted' };
  }

  async reorder(id: string, direction: 'up' | 'down') {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    const adjacent = await this.prisma.banner.findFirst({
      where: {
        order: direction === 'up' ? { lt: banner.order } : { gt: banner.order },
      },
      orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
    });

    if (!adjacent) throw new BadRequestException(`Cannot move ${direction}, already at the edge`);

    await this.prisma.$transaction([
      this.prisma.banner.update({ where: { id: banner.id }, data: { order: adjacent.order } }),
      this.prisma.banner.update({ where: { id: adjacent.id }, data: { order: banner.order } }),
    ]);

    return this.findAll();
  }

  async toggle(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    const updated = await this.prisma.banner.update({ where: { id }, data: { status: newStatus } });
    return { ...updated, active: updated.status === 'active' };
  }
}
