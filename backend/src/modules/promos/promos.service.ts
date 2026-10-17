import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/generated/client';
import { PrismaService } from '@/prisma/prisma.service';

const PROMO_TYPES = ['percent', 'fixed', 'free_shipping'] as const;
type PromoType = (typeof PROMO_TYPES)[number];

export interface PromoInput {
  code?: string;
  type?: string;
  value?: number | string;
  minOrder?: number | string | null;
  maxUses?: number | string | null;
  /** ISO date string, or null for "never expires". */
  expiresAt?: string | null;
  active?: boolean;
}

export type PromoStatus = 'active' | 'inactive' | 'expired' | 'exhausted';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const promos = await this.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    return promos.map((p) => this.withStatus(p));
  }

  async create(input: PromoInput) {
    const code = this.parseCode(input.code);
    const data = this.parseFields(input, undefined);
    try {
      const promo = await this.prisma.promoCode.create({
        data: { code, active: input.active ?? true, ...data } as Prisma.PromoCodeCreateInput,
      });
      return this.withStatus(promo);
    } catch (e) {
      throw this.mapUnique(e);
    }
  }

  async update(id: string, input: PromoInput) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promo code not found');

    const data: Record<string, unknown> = this.parseFields(input, existing);
    if (input.code !== undefined) {
      const code = this.parseCode(input.code);
      if (code !== existing.code) {
        if (existing.usedCount > 0) {
          throw new ConflictException('A code that has been used can’t be renamed. Create a new one instead.');
        }
        data.code = code;
      }
    }
    if (input.active !== undefined) data.active = Boolean(input.active);

    try {
      const promo = await this.prisma.promoCode.update({ where: { id }, data });
      return this.withStatus(promo);
    } catch (e) {
      throw this.mapUnique(e);
    }
  }

  async remove(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    if (promo.usedCount > 0) {
      throw new ConflictException(
        `${promo.code} has been used ${promo.usedCount} time${promo.usedCount === 1 ? '' : 's'}. Deactivate it instead of deleting.`,
      );
    }
    await this.prisma.promoCode.delete({ where: { id } });
    return { id, code: promo.code };
  }

  private parseCode(raw: unknown): string {
    const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
      throw new BadRequestException(
        'Code must be 3–24 characters: letters, numbers, dashes or underscores',
      );
    }
    return code;
  }

  /** Validates the editable fields; `existing` supplies defaults when updating. */
  private parseFields(input: PromoInput, existing?: { type: string; value: number }) {
    const out: Record<string, unknown> = {};

    const type = (input.type ?? existing?.type) as PromoType | undefined;
    if (!type || !PROMO_TYPES.includes(type)) {
      throw new BadRequestException(`type must be one of: ${PROMO_TYPES.join(', ')}`);
    }
    if (input.type !== undefined || !existing) out.type = type;

    if (input.value !== undefined || !existing || input.type !== undefined) {
      const raw = input.value ?? existing?.value ?? 0;
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new BadRequestException('value must be a number');
      if (type === 'percent' && (value < 1 || value > 100)) {
        throw new BadRequestException('A percentage discount must be between 1 and 100');
      }
      if (type === 'fixed' && (value <= 0 || value > 10000)) {
        throw new BadRequestException('A fixed discount must be greater than 0 and at most 10,000');
      }
      out.value = type === 'free_shipping' ? 0 : Math.round(value * 100) / 100;
    }

    if (input.minOrder !== undefined) {
      if (input.minOrder === null || input.minOrder === '') out.minOrder = null;
      else {
        const min = Number(input.minOrder);
        if (!Number.isFinite(min) || min < 0) throw new BadRequestException('minOrder must be 0 or more');
        out.minOrder = Math.round(min * 100) / 100;
      }
    }

    if (input.maxUses !== undefined) {
      if (input.maxUses === null || input.maxUses === '') out.maxUses = null;
      else {
        const max = Number(input.maxUses);
        if (!Number.isInteger(max) || max < 1) {
          throw new BadRequestException('maxUses must be a whole number of 1 or more');
        }
        out.maxUses = max;
      }
    }

    if (input.expiresAt !== undefined) {
      if (input.expiresAt === null || input.expiresAt === '') out.expiresAt = null;
      else {
        const date = new Date(input.expiresAt);
        if (Number.isNaN(date.getTime())) throw new BadRequestException('expiresAt is not a valid date');
        out.expiresAt = date;
      }
    }
    return out;
  }

  private withStatus<T extends { active: boolean; expiresAt: Date | null; maxUses: number | null; usedCount: number }>(
    promo: T,
  ) {
    let status: PromoStatus = 'active';
    if (!promo.active) status = 'inactive';
    else if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) status = 'expired';
    else if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) status = 'exhausted';
    return { ...promo, status };
  }

  private mapUnique(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('A promo code with that name already exists');
    }
    return e;
  }
}
