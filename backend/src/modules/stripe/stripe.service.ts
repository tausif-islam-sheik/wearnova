import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '@/prisma/prisma.service';
import { AppConfigService } from '@/config/config.service';
import { StripeCredentialsService } from './stripe-credentials.service';
import { OrderStatus, PaymentStatus } from '@/generated/enums';
import { consumeUnits } from '@/modules/listings/stock';

interface PayoutTarget {
  orderId: string;
  buyerName: string;
  productName: string;
  total: number;
  sellerStripeAccountId: string;
  currency?: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly credentials: StripeCredentialsService,
  ) {}

  private async client(): Promise<Stripe> {
    if (!(await this.credentials.isConfigured())) {
      throw new ServiceUnavailableException(
        'Online payments are not available right now. (Stripe is not configured: add your Stripe keys in Admin → Settings → Payments.)',
      );
    }
    const { secretKey } = await this.credentials.resolve();
    return new Stripe(secretKey);
  }

  /** A well-formed but wrong key surfaces as a Stripe auth error: show a clear 503, not a 500. */
  private translate(error: unknown): never {
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      this.logger.error('Stripe rejected the configured API key');
      throw new ServiceUnavailableException(
        'Stripe rejected the configured API key. Check Admin → Settings → Payments.',
      );
    }
    throw error;
  }

  // ---------------------------------------------------------------------------
  // Stripe Connect onboarding
  // ---------------------------------------------------------------------------

  async connectOnboard(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const stripe = await this.client();
    const frontendUrl = this.config.frontendUrl.replace(/\/$/, '');

    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/settings/payments?refresh=1`,
      return_url: `${frontendUrl}/settings/payments?onboarding=success`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url, accountId };
  }

  async connectStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeAccountId) {
      return {
        accountId: null,
        onboardingComplete: false,
        payoutsEnabled: false,
      };
    }

    try {
      const account = await (await this.client()).accounts.retrieve(user.stripeAccountId);
      const onboardingComplete = Boolean(account.details_submitted);
      const payoutsEnabled = Boolean(account.payouts_enabled && account.charges_enabled);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeOnboardingComplete: onboardingComplete,
          stripePayoutsEnabled: payoutsEnabled,
        },
      });

      return { accountId: account.id, onboardingComplete, payoutsEnabled };
    } catch (error) {
      this.logger.error(`Failed to retrieve Connect account ${user.stripeAccountId}`, error);
      throw new ServiceUnavailableException('Could not fetch Stripe Connect status');
    }
  }

  // ---------------------------------------------------------------------------
  // Escrow payments
  // ---------------------------------------------------------------------------

  async getPlatformFeePercent(): Promise<number> {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'platform_fee_percent' },
    });
    const parsed = setting ? Number(setting.value) : this.config.platformFeePercentDefault;
    if (Number.isNaN(parsed)) return this.config.platformFeePercentDefault;
    return Math.min(Math.max(parsed, 0), 50);
  }

  /**
   * Create the PaymentIntent for an order, or — when the buyer comes back and
   * changes shipping/promo — update the existing intent's amount and return the
   * same client secret (no duplicate intents per order).
   */
  async createCheckoutPayment(order: { id: string; total: number; listingId: string }) {
    try {
      return await this.createCheckoutPaymentUnsafe(order);
    } catch (error) {
      return this.translate(error);
    }
  }

  private async createCheckoutPaymentUnsafe(order: {
    id: string;
    total: number;
    listingId: string;
  }) {
    const stripe = await this.client();
    const feePercent = await this.getPlatformFeePercent();
    const amount = Math.round(order.total * 100);
    const platformFeeAmount = Math.round((amount * feePercent) / 100);
    const sellerPayoutAmount = amount - platformFeeAmount;

    const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
    if (existing) {
      let intent = await stripe.paymentIntents.retrieve(existing.stripePaymentIntentId);
      if (
        intent.status === 'requires_payment_method' ||
        intent.status === 'requires_confirmation'
      ) {
        if (intent.amount !== amount) {
          intent = await stripe.paymentIntents.update(intent.id, { amount });
        }
        await this.prisma.payment.update({
          where: { id: existing.id },
          data: { amount, platformFeeAmount, platformFeePercent: feePercent, sellerPayoutAmount },
        });
        return { clientSecret: intent.client_secret };
      }
      throw new ConflictException('A payment for this order is already in progress or complete.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { orderId: order.id, listingId: order.listingId },
      automatic_payment_methods: { enabled: true },
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        platformFeeAmount,
        platformFeePercent: feePercent,
        sellerPayoutAmount,
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  /** Read the live PaymentIntent for an order (used to sync without the webhook). */
  async getIntentStatus(orderId: string): Promise<Stripe.PaymentIntent['status'] | null> {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return null;
    const intent = await (
      await this.client()
    ).paymentIntents.retrieve(payment.stripePaymentIntentId);
    return intent.status;
  }

  /**
   * Idempotent "payment succeeded" transition shared by the webhook and the
   * buyer-triggered sync: capture the payment, move the order to escrow, mark
   * the listing sold, cancel competing pending orders and redeem the promo.
   */
  async applyPaymentSucceeded(paymentIntentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment) return;

    const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
    if (!order) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.captured, capturedAt: payment.capturedAt ?? new Date() },
    });

    if (order.status !== OrderStatus.PENDING_PAYMENT) return; // already applied

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID_ESCROW } });
      // The units this order was holding are now sold; the listing status follows from what's left.
      await consumeUnits(tx, order);
      if (order.promoCode) {
        await tx.promoCode.updateMany({
          where: { code: order.promoCode },
          data: { usedCount: { increment: 1 } },
        });
      }
    });
  }

  /** Best-effort: cancel the open PaymentIntent for an abandoned order. */
  async cancelIntent(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return;
    if (!(await this.credentials.isConfigured())) return;
    try {
      await (await this.client()).paymentIntents.cancel(payment.stripePaymentIntentId);
    } catch (error) {
      this.logger.warn(
        `Could not cancel intent ${payment.stripePaymentIntentId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Buyer confirmed receipt -> release escrow to seller via a standalone
   * transfer (separate charges and transfers; no transfer_data on the intent).
   */
  async releaseToSeller(target: PayoutTarget) {
    const stripe = await this.client();
    const feePercent = await this.getPlatformFeePercent();
    const amount = Math.round(target.total * 100);
    const platformFeeAmount = Math.round((amount * feePercent) / 100);
    const sellerPayoutAmount = amount - platformFeeAmount;

    const transfer = await stripe.transfers.create(
      {
        amount: sellerPayoutAmount,
        currency: target.currency ?? 'usd',
        destination: target.sellerStripeAccountId,
        transfer_group: target.orderId,
        metadata: { orderId: target.orderId },
      },
      { idempotencyKey: `escrow-release-${target.orderId}` },
    );

    await this.prisma.payment.update({
      where: { orderId: target.orderId },
      data: {
        status: PaymentStatus.captured,
        platformFeeAmount,
        platformFeePercent: feePercent,
        sellerPayoutAmount,
        stripeTransferId: transfer.id,
        releasedAt: new Date(),
      },
    });

    await this.prisma.transaction.create({
      data: {
        orderId: target.orderId,
        productName: target.productName,
        buyer: target.buyerName,
        gross: amount / 100,
        fee: platformFeeAmount / 100,
        net: sellerPayoutAmount / 100,
        payout: transfer.id,
      },
    });

    return transfer;
  }

  async refundPaymentIntent(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('No payment record for this order');
    if (payment.stripeTransferId) {
      throw new ConflictException(
        'Funds have already been released to the seller. Refund the transfer manually on Stripe before refunding the buyer.',
      );
    }

    const stripe = await this.client();
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.refunded },
    });

    return { refunded: true };
  }

  // ---------------------------------------------------------------------------
  // Webhook handling
  // ---------------------------------------------------------------------------

  async handleWebhook(rawBody: Buffer, signature: string) {
    const { webhookSecret } = await this.credentials.resolve();
    if (!webhookSecret) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing webhook payload or signature');
    }

    const stripe = await this.client();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // `transfer.failed` is not part of the typed event union — match by string.
    if ((event.type as string) === 'transfer.failed') {
      const transfer = event.data.object as Stripe.Transfer;
      this.logger.error(
        `Escrow transfer FAILED: ${transfer.id} (order ${transfer.metadata?.orderId ?? 'unknown'}, amount ${transfer.amount}). Funds remain held — alert admin.`,
      );
      return { received: true };
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.applyPaymentSucceeded(pi.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PaymentStatus.failed },
        });
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await this.prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeOnboardingComplete: Boolean(account.details_submitted),
            stripePayoutsEnabled: Boolean(account.payouts_enabled && account.charges_enabled),
          },
        });
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const orderId = transfer.metadata?.orderId;
        if (!orderId) break;
        await this.prisma.payment.update({
          where: { orderId },
          data: { stripeTransferId: transfer.id },
        });
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer;
        this.logger.error(
          `Transfer reversed: ${transfer.id} (order ${transfer.metadata?.orderId ?? 'unknown'})`,
        );
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: String(dispute.payment_intent) },
        });
        if (!payment) break;
        const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
        if (order && order.status !== OrderStatus.DISPUTED) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.DISPUTED },
          });
          this.logger.warn(`Dispute opened for order ${order.id}`);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }
}
