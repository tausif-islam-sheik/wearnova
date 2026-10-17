import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AddressDto } from './dto/address.dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async create(userId: string, dto: AddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) {
      throw new ForbiddenException(`You can save up to ${MAX_ADDRESSES} addresses.`);
    }
    // The first address is always the default.
    const isDefault = count === 0 ? true : (dto.isDefault ?? false);
    return this.prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({ data: { ...dto, isDefault, userId } });
    });
  }

  async update(userId: string, id: string, dto: AddressDto) {
    await this.findOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault)
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: dto });
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.findOwned(userId, id);
    await this.prisma.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      if (next)
        await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { deleted: true };
  }

  private async findOwned(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
    return address;
  }
}
