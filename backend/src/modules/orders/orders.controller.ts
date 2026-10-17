import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, QuoteOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto';
import { ShippingSettingsService } from './shipping-settings.service';
import { SHIPPING_METHOD_IDS } from './shipping.constants';
import { Audited } from '@/modules/audit/audited.decorator';

type AuthedRequest = { user: { id: string; role: string } };

/** Buyers/sellers send the regular token; the admin panel sends the admin token. */
const ANY_AUTH = ['jwt', 'jwt-admin'];

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly shippingSettings: ShippingSettingsService,
  ) {}

  @Get('shipping-methods')
  @ApiOperation({ summary: 'Public: shipping methods, prices and the free-shipping threshold' })
  async shippingMethods() {
    const settings = await this.shippingSettings.get();
    return {
      methods: SHIPPING_METHOD_IDS.map((id) => ({ id, ...settings.methods[id] })),
      freeShippingOver: settings.freeShippingOver,
    };
  }

  @Audited({
    action: 'settings.shipping',
    targetType: 'settings',
    target: () => 'shipping',
    summary: () => 'Updated shipping settings',
  })
  @Put('shipping-settings')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiOperation({ summary: 'Admin: update shipping prices and rules' })
  async updateShippingSettings(@Body() dto: UpdateShippingSettingsDto) {
    const settings = await this.shippingSettings.update(dto);
    return {
      methods: SHIPPING_METHOD_IDS.map((id) => ({ id, ...settings.methods[id] })),
      freeShippingOver: settings.freeShippingOver,
    };
  }

  @Post('quote')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Price a prospective order (item, shipping, promo, total)' })
  async quote(@Body() dto: QuoteOrderDto) {
    return this.ordersService.quote(dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Place (or update the pending) order for a listing' })
  async create(@Req() req: AuthedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard(ANY_AUTH))
  @ApiOperation({ summary: 'List orders (admins: all; users: their own)' })
  async findAll(
    @Req() req: AuthedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.ordersService.findAll(
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status,
        buyerId,
        sellerId,
      },
      req.user,
    );
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiOperation({ summary: 'Get order statistics (admin)' })
  async getStats() {
    return this.ordersService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard(ANY_AUTH))
  @ApiOperation({ summary: 'Get an order (buyer, seller or admin)' })
  async findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user);
  }

  @Audited({
    action: 'order.status',
    targetType: 'order',
    summary: ({ req }) => `Set order ${(req.params.id ?? '').slice(-8)} to ${String(req.body.status)}`,
  })
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.id);
  }

  @Post(':id/checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create/update the Stripe PaymentIntent for an order (escrow)' })
  async checkout(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.checkout(req.user.id, id);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Buyer cancels an order that is still awaiting payment' })
  async cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.cancel(req.user.id, id);
  }

  @Post(':id/sync-payment')
  @UseGuards(AuthGuard(ANY_AUTH))
  @ApiOperation({ summary: 'Re-check the PaymentIntent with Stripe and update the order' })
  async syncPayment(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.syncPayment(req.user, id);
  }

  @Post(':id/confirm-received')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Buyer confirms receipt and releases escrow to the seller' })
  async confirmReceived(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.confirmReceived(req.user.id, id);
  }

  @Post(':id/dispute')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Buyer opens a dispute on an order' })
  async dispute(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: { reason?: string; details?: string },
  ) {
    return this.ordersService.dispute(req.user.id, id, body ?? {});
  }

  @Audited({
    action: 'order.release',
    targetType: 'order',
    summary: ({ req }) => `Released escrow funds for order ${(req.params.id ?? '').slice(-8)} to the seller`,
  })
  @Post(':id/release-funds')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiOperation({ summary: 'Admin releases escrow funds to the seller (dispute resolution)' })
  async releaseFunds(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.adminRelease(id, req.user.id);
  }

  @Audited({
    action: 'order.refund',
    targetType: 'order',
    summary: ({ req }) => `Refunded order ${(req.params.id ?? '').slice(-8)} to the buyer`,
  })
  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiOperation({ summary: 'Admin refunds the buyer (escrow still held)' })
  async refund(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ordersService.adminRefund(id, req.user.id);
  }
}
