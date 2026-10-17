import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StripeService } from '@/modules/stripe/stripe.service';
import { CreateOrderDto, QuoteOrderDto } from './dto/create-order.dto';
import { PricingService } from './pricing.service';
import { releaseUnits, reserveUnits } from '@/modules/listings/stock';
import { PENDING_ORDER_TTL_MINUTES } from './shipping.constants';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@/generated/enums';

const ORDER_INCLUDE = {
  listing: { select: { id: true, title: true, images: true, price: true } },
  buyer: { select: { id: true, name: true, email: true } },
  seller: { select: { id: true, name: true, email: true } },
} as const;

export interface AuthUser {
  id: string;
  role: string;
}

const DISPUTE_REASONS = ['not_received', 'not_as_described', 'damaged', 'other'];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly pricing: PricingService,
  ) {}

  async updateStatus(id: string, dto: UpdateOrderStatusDto, adminId?: string) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');

    const status = dto.status as OrderStatus;
    if (status === OrderStatus.DISPUTED && adminId) {
      // Keep the dispute queue in step when an admin flags an order by hand.
      await this.prisma.dispute.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          openedById: adminId,
          reason: 'other',
          details: 'Marked as disputed by an admin.',
        },
        update: {},
      });
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        shippedAt: status === OrderStatus.SHIPPED ? new Date() : existing.shippedAt,
      },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });
  }

  quote(dto: QuoteOrderDto) {
    return this.pricing.computeQuote(dto);
  }

  /**
   * Create the buyer's order for a listing — or update their existing pending
   * one, so Back/Next in checkout never leaves orphan orders. Pricing is always
   * computed server-side.
   */
  async create(userId: string, dto: CreateOrderDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { seller: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId === userId) {
      throw new ForbiddenException("You can't buy your own listing.");
    }

    const pending = await this.prisma.order.findFirst({
      where: { listingId: listing.id, buyerId: userId, status: OrderStatus.PENDING_PAYMENT },
    });
    // Buyable while stock is left, or if this buyer already holds a unit from an earlier visit
    // to checkout (the listing may read "reserved" because their unit was the last one).
    const holdsOwn = Boolean(pending && pending.unitsHeld > 0);
    const inStock = listing.status === 'active' && listing.quantity > 0;
    const buyable = inStock || (holdsOwn && listing.status !== 'deactivated');
    if (!buyable) throw new ConflictException('This item is no longer available.');

    const seller = listing.seller;
    if (!seller.stripeAccountId || !seller.stripePayoutsEnabled) {
      throw new ConflictException(
        'This seller has not completed their payout setup yet. Please try again later.',
      );
    }

    const quote = await this.pricing.computeQuote(dto);
    const data = {
      price: listing.price,
      quantity: quote.quantity,
      shippingCost: quote.shipping,
      discount: quote.discount,
      promoCode: quote.promo?.code ?? null,
      shippingMethod: quote.shippingMethod,
      total: quote.total,
      shippingAddress: dto.shippingAddress as never,
    };

    if (pending) {
      return this.prisma.order.update({ where: { id: pending.id }, data, include: ORDER_INCLUDE });
    }
    return this.prisma.order.create({
      data: { ...data, listingId: listing.id, buyerId: userId, sellerId: listing.sellerId },
      include: ORDER_INCLUDE,
    });
  }

  // ---------------------------------------------------------------------------
  // Escrow lifecycle
  // ---------------------------------------------------------------------------

  /** Buyer pays -> Stripe PaymentIntent created; funds held in platform escrow. */
  async checkout(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId)
      throw new ForbiddenException('You are not the buyer of this order');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ConflictException('This order is not awaiting payment');
    }

    const seller = await this.prisma.user.findUnique({ where: { id: order.sellerId } });
    if (!seller?.stripeAccountId || !seller.stripePayoutsEnabled) {
      throw new ConflictException(
        'The seller has not completed their payout setup. Payment cannot be processed.',
      );
    }

    // Atomically hold a unit so two buyers can't pay for the same last item. Idempotent: coming
    // back to checkout with the units already held takes nothing more.
    const heldNow = await reserveUnits(this.prisma, order.id);

    try {
      const { clientSecret } = await this.stripeService.createCheckoutPayment({
        id: order.id,
        listingId: order.listingId,
        total: order.total,
      });
      return { orderId: order.id, clientSecret };
    } catch (error) {
      if (heldNow) await releaseUnits(this.prisma, order.id);
      throw error;
    }
  }

  /** Buyer abandons checkout: cancel the order, cancel the intent, free the listing. */
  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId)
      throw new ForbiddenException('You are not the buyer of this order');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ConflictException('Only orders awaiting payment can be cancelled');
    }
    return this.cancelPending(order.id);
  }

  private async cancelPending(orderId: string) {
    await this.stripeService.cancelIntent(orderId);
    await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
      data: { status: OrderStatus.CANCELLED },
    });
    await releaseUnits(this.prisma, orderId);
    return this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  }

  /**
   * Called by the confirmation page after Stripe redirects back: reads the live
   * PaymentIntent and applies "payment succeeded" idempotently, so the flow works
   * even when the webhook is delayed or not configured (local dev).
   */
  async syncPayment(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    this.assertCanView(order, user);

    if (order.status === OrderStatus.PENDING_PAYMENT) {
      const payment = await this.prisma.payment.findUnique({ where: { orderId } });
      if (payment) {
        const status = await this.stripeService.getIntentStatus(orderId);
        if (status === 'succeeded') {
          await this.stripeService.applyPaymentSucceeded(payment.stripePaymentIntentId);
        }
      }
    }
    return this.findOne(orderId, user);
  }

  /** Cancel stale pending orders and free their reservations (run by the scheduler). */
  async expireStaleOrders() {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
    const stale = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING_PAYMENT, updatedAt: { lte: cutoff } },
      select: { id: true },
    });
    for (const order of stale) {
      try {
        await this.cancelPending(order.id);
      } catch (error) {
        this.logger.error(
          `Could not expire order ${order.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return stale.length;
  }

  private assertCanView(order: { buyerId: string; sellerId: string }, user: AuthUser) {
    if (user.role === 'admin') return;
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }

  /** Buyer confirms receipt -> escrow released to seller. */
  async confirmReceived(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true, buyer: true, listing: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId)
      throw new ForbiddenException('You are not the buyer of this order');
    if (order.status !== OrderStatus.PAID_ESCROW && order.status !== OrderStatus.SHIPPED) {
      throw new ConflictException('Order is not in a state that can be confirmed as received');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED_CONFIRMED },
    });

    if (!order.seller.stripeAccountId) {
      throw new ConflictException('Seller has no Stripe Connect account');
    }

    await this.stripeService.releaseToSeller({
      orderId: order.id,
      buyerName: order.buyer.name,
      productName: order.listing.title,
      total: order.total,
      sellerStripeAccountId: order.seller.stripeAccountId,
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RELEASED_TO_SELLER },
    });
  }

  /** Buyer opens a dispute -> funds stay in escrow until resolved. */
  async dispute(userId: string, orderId: string, input: { reason?: string; details?: string } = {}) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId)
      throw new ForbiddenException('You are not the buyer of this order');
    if (
      order.status !== OrderStatus.PAID_ESCROW &&
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.DELIVERED_CONFIRMED
    ) {
      throw new ConflictException('This order cannot be disputed at its current stage');
    }

    const reason = input.reason ?? 'other';
    if (!DISPUTE_REASONS.includes(reason)) {
      throw new BadRequestException(`reason must be one of: ${DISPUTE_REASONS.join(', ')}`);
    }
    const details = input.details?.trim() || null;
    if (details && details.length > 500) {
      throw new BadRequestException('details must be at most 500 characters');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.DISPUTED } }),
      this.prisma.dispute.upsert({
        where: { orderId },
        create: { orderId, openedById: userId, reason, details },
        update: { reason, details, status: 'open', resolution: null, resolvedAt: null, resolvedById: null },
      }),
    ]);
    return updated;
  }

  /** Close the order's open dispute (if any) once an admin has settled it. */
  private async closeDispute(orderId: string, resolution: 'released' | 'refunded', adminId?: string) {
    await this.prisma.dispute.updateMany({
      where: { orderId, status: 'open' },
      data: { status: 'resolved', resolution, resolvedAt: new Date(), resolvedById: adminId ?? null },
    });
  }

  /** Admin resolves a dispute in the seller's favour -> release escrow. */
  async adminRelease(orderId: string, adminId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true, buyer: true, listing: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.DISPUTED && order.status !== OrderStatus.DELIVERED_CONFIRMED) {
      throw new ConflictException('Only disputed or confirmed orders can be manually released');
    }
    if (!order.seller.stripeAccountId) {
      throw new ConflictException('Seller has no Stripe Connect account');
    }

    await this.stripeService.releaseToSeller({
      orderId: order.id,
      buyerName: order.buyer.name,
      productName: order.listing.title,
      total: order.total,
      sellerStripeAccountId: order.seller.stripeAccountId,
    });

    const released = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RELEASED_TO_SELLER },
    });
    await this.closeDispute(orderId, 'released', adminId);
    return released;
  }

  /** Admin refunds the buyer (only possible while funds are still in escrow). */
  async adminRefund(orderId: string, adminId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.RELEASED_TO_SELLER) {
      throw new ConflictException('Funds were already released to the seller');
    }

    await this.stripeService.refundPaymentIntent(orderId);

    const refunded = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });
    await this.closeDispute(orderId, 'refunded', adminId);
    return refunded;
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      status?: string;
      buyerId?: string;
      sellerId?: string;
    },
    user: AuthUser,
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.buyerId) where.buyerId = query.buyerId;
    if (query.sellerId) where.sellerId = query.sellerId;
    // Non-admins only ever see orders they are a party to.
    if (user.role !== 'admin') where.OR = [{ buyerId: user.id }, { sellerId: user.id }];

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, images: true, price: true } },
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.order.count({ where: where as never }),
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        review: true,
        transaction: true,
        payment: true,
        dispute: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertCanView(order, user);
    return order;
  }

  async getStats() {
    const [
      total,
      pendingPayment,
      paidEscrow,
      shipped,
      deliveredConfirmed,
      released,
      disputed,
      refunded,
      cancelled,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.order.count({ where: { status: 'PAID_ESCROW' } }),
      this.prisma.order.count({ where: { status: 'SHIPPED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED_CONFIRMED' } }),
      this.prisma.order.count({ where: { status: 'RELEASED_TO_SELLER' } }),
      this.prisma.order.count({ where: { status: 'DISPUTED' } }),
      this.prisma.order.count({ where: { status: 'REFUNDED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

    const revenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'RELEASED_TO_SELLER' },
    });

    return {
      total,
      pendingPayment,
      paidEscrow,
      shipped,
      deliveredConfirmed,
      released,
      disputed,
      refunded,
      cancelled,
      revenue: revenue._sum.total ?? 0,
    };
  }
}
