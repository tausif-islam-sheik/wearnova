import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited } from '@/modules/audit/audited.decorator';
import { InventoryService } from './inventory.service';

const VERBS: Record<string, string> = {
  activate: 'Reactivated',
  deactivate: 'Deactivated',
  promote: 'Promoted',
  unpromote: 'Removed the promotion from',
};

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt-admin'))
@Controller('admin/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Inventory totals, aging and top categories/brands/sellers (admin only)' })
  async getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('items')
  @ApiOperation({ summary: 'Inventory table: filter by view, search, sort and page (admin only)' })
  async findItems(
    @Query('view') view?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.findItems({
      view,
      search,
      sort,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('bulk')
  @Audited({
    action: 'listing.bulk',
    targetType: 'listing',
    target: () => undefined,
    summary: ({ req, res }) =>
      `${VERBS[String(req.body.action)] ?? 'Updated'} ${String(res?.updated ?? 0)} listing${res?.updated === 1 ? '' : 's'}`,
  })
  @ApiOperation({ summary: 'Activate, deactivate or (un)promote many listings; unsafe ones are skipped (admin only)' })
  async bulk(@Body() body: { ids?: string[]; action?: string }) {
    return this.inventoryService.bulk(body?.ids, body?.action);
  }

  @Patch(':id/stock')
  @Audited({
    action: 'listing.stock',
    targetType: 'listing',
    summary: ({ req, res }) =>
      `Set stock for "${String(res?.title ?? req.params.id)}" to ${String(req.body.quantity)}`,
  })
  @ApiOperation({ summary: 'Set a listing’s stock (admin only)' })
  async setStock(@Param('id') id: string, @Body() body: { quantity?: number }) {
    return this.inventoryService.setStock(id, body?.quantity);
  }
}
