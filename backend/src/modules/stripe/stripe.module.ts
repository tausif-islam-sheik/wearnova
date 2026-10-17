import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeCredentialsService } from './stripe-credentials.service';

@Module({
  controllers: [StripeController],
  providers: [StripeService, StripeCredentialsService],
  exports: [StripeService, StripeCredentialsService],
})
export class StripeModule {}
