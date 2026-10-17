import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StripeService } from './stripe.service';
import { StripeCredentialsService } from './stripe-credentials.service';
import { UpdateStripeSettingsDto } from './dto/update-stripe-settings.dto';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly credentials: StripeCredentialsService,
  ) {}

  @Get('config')
  @ApiOperation({
    summary: 'Public: the publishable key the checkout needs to render the card form',
  })
  async publicConfig() {
    return this.credentials.getPublicConfig();
  }

  @Get('settings')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Stripe key status (secrets are masked)' })
  async getSettings() {
    return this.credentials.getAdminView();
  }

  @Audited({
    action: 'settings.stripe',
    targetType: 'settings',
    target: () => 'stripe',
    summary: ({ req }) => `Updated Stripe settings (${Object.keys(req.body ?? {}).join(', ') || 'no fields'})`,
  })
  @Put('settings')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin: save Stripe keys ("" removes a saved key and falls back to .env)',
  })
  async updateSettings(@Body() dto: UpdateStripeSettingsDto) {
    return this.credentials.update(dto);
  }

  @Post('settings/test')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: verify the saved secret key against Stripe' })
  async testSettings() {
    return this.credentials.test();
  }

  @Post('connect/onboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe Connect onboarding link for the seller' })
  async onboard(@Req() req: { user: { id: string } }) {
    return this.stripeService.connectOnboard(req.user.id);
  }

  @Get('connect/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Connect onboarding status for the seller' })
  async connectStatus(@Req() req: { user: { id: string } }) {
    return this.stripeService.connectStatus(req.user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint (raw body)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(
      req.rawBody ?? (req.body as unknown as Buffer),
      signature,
    );
  }
}
