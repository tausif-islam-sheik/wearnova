import { Module } from '@nestjs/common';
import { StripeModule } from '@/modules/stripe/stripe.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { ShippingSettingsService } from './shipping-settings.service';
import { EscrowReleaseScheduler } from './escrow-release.scheduler';
import { OrderExpiryScheduler } from './order-expiry.scheduler';

@Module({
  imports: [StripeModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PricingService,
    ShippingSettingsService,
    EscrowReleaseScheduler,
    OrderExpiryScheduler,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
