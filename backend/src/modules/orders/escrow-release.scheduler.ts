import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrderStatus } from '@/generated/enums';
import { AppConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { StripeService } from '@/modules/stripe/stripe.service';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Auto-confirms delivery and releases escrow funds N days after an order is
 * marked SHIPPED, when the buyer has not confirmed receipt and has not opened
 * a dispute. The window is configurable via ESCROW_AUTO_CONFIRM_DAYS (default
 * 7). Set to 0 to disable the job entirely.
 */
@Injectable()
export class EscrowReleaseScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EscrowReleaseScheduler.name);
  private readonly runIntervalMs = HOUR_MS;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit(): void {
    if (this.config.escrowAutoConfirmDays <= 0) {
      this.logger.log('Escrow auto-confirm disabled (ESCROW_AUTO_CONFIRM_DAYS=0)');
      return;
    }
    this.logger.log(
      `Escrow auto-confirm enabled: releasing funds ${this.config.escrowAutoConfirmDays} day(s) after shipment`,
    );
    this.timer = setInterval(() => void this.releaseExpired(), this.runIntervalMs);
    void this.releaseExpired();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async releaseExpired(): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.escrowAutoConfirmDays * DAY_MS);

    const expired = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.SHIPPED,
        OR: [
          { shippedAt: { not: null, lte: cutoff } },
          { shippedAt: null, updatedAt: { lte: cutoff } },
        ],
      },
      include: { seller: true, buyer: true, listing: true },
    });

    for (const order of expired) {
      try {
        if (!order.seller.stripeAccountId) {
          this.logger.warn(
            `Skipping auto-release for order ${order.id}: seller has no Stripe account`,
          );
          continue;
        }
        await this.stripeService.releaseToSeller({
          orderId: order.id,
          buyerName: order.buyer.name,
          productName: order.listing.title,
          total: order.total,
          sellerStripeAccountId: order.seller.stripeAccountId,
        });
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.RELEASED_TO_SELLER },
        });
        this.logger.log(`Auto-confirmed delivery and released escrow for order ${order.id}`);
      } catch (error) {
        this.logger.error(
          `Auto-release failed for order ${order.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
  }
}
