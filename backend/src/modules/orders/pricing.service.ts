import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ShippingSettingsService } from './shipping-settings.service';
import { SHIPPING_METHOD_IDS, type ShippingMethodId } from './shipping.constants';

export interface QuoteInput {
  listingId: string;
  shippingMethod?: ShippingMethodId;
  promoCode?: string;
}

export interface Quote {
  listingId: string;
  quantity: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: ShippingMethodId;
  shippingLabel: string;
  shippingEta: string;
  promo: { code: string; type: string; description: string } | null;
}

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

/**
 * Single source of truth for order pricing. The quote endpoint (live summary)
 * and order creation both call this, so client and server totals never diverge.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingSettings: ShippingSettingsService,
  ) {}

  /** Throws BadRequestException with a user-facing message for an unusable code. */
  async validatePromo(code: string, subtotal: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!promo || !promo.active) throw new BadRequestException('This promo code is not valid.');
    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now())
      throw new BadRequestException('This promo code has expired.');
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
      throw new BadRequestException('This promo code has reached its usage limit.');
    if (promo.minOrder !== null && subtotal < promo.minOrder)
      throw new BadRequestException(
        `This promo code needs an order of at least $${promo.minOrder.toFixed(2)}.`,
      );
    return promo;
  }

  async computeQuote(input: QuoteInput): Promise<Quote> {
    const listing = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const shipping = await this.shippingSettings.get();
    const enabled = SHIPPING_METHOD_IDS.filter((id) => shipping.methods[id].enabled);
    // A method an admin has since disabled falls back to the first one still on offer.
    const methodId: ShippingMethodId =
      input.shippingMethod && enabled.includes(input.shippingMethod)
        ? input.shippingMethod
        : (enabled[0] ?? 'standard');
    const method = shipping.methods[methodId];

    const quantity = 1; // a buyer takes one unit per order (stock is tracked on the listing)
    const subtotalC = toCents(listing.price) * quantity;
    const overThreshold =
      shipping.freeShippingOver !== null && subtotalC >= toCents(shipping.freeShippingOver);
    let shippingC =
      method.freeEligible && (listing.shippingFree || overThreshold) ? 0 : toCents(method.price);
    let discountC = 0;
    let promoInfo: Quote['promo'] = null;

    if (input.promoCode?.trim()) {
      const promo = await this.validatePromo(input.promoCode, fromCents(subtotalC));
      if (promo.type === 'percent') {
        discountC = Math.round((subtotalC * Math.min(promo.value, 100)) / 100);
        promoInfo = { code: promo.code, type: promo.type, description: `${promo.value}% off` };
      } else if (promo.type === 'fixed') {
        discountC = Math.min(toCents(promo.value), subtotalC);
        promoInfo = {
          code: promo.code,
          type: promo.type,
          description: `$${promo.value.toFixed(2)} off`,
        };
      } else {
        if (shippingC === 0) throw new ConflictException('This order already ships free.');
        discountC = 0;
        shippingC = 0;
        promoInfo = { code: promo.code, type: promo.type, description: 'Free shipping' };
      }
    }

    return {
      listingId: listing.id,
      quantity,
      subtotal: fromCents(subtotalC),
      shipping: fromCents(shippingC),
      discount: fromCents(discountC),
      total: fromCents(subtotalC - discountC + shippingC),
      shippingMethod: methodId,
      shippingLabel: method.label,
      shippingEta: method.eta,
      promo: promoInfo,
    };
  }
}
