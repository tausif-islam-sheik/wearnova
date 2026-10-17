import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromosService, type PromoInput } from './promos.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Promos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt-admin'))
@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get()
  @ApiOperation({ summary: 'List promo codes with usage (admin only)' })
  async findAll() {
    return this.promosService.findAll();
  }

  @Audited({
    action: 'promo.create',
    targetType: 'promo',
    target: ({ res }) => res?.id as string | undefined,
    summary: ({ res }) => `Created promo code ${String(res?.code ?? '')}`,
  })
  @Post()
  @ApiOperation({ summary: 'Create a promo code (admin only)' })
  async create(@Body() body: PromoInput) {
    return this.promosService.create(body);
  }

  @Audited({
    action: 'promo.update',
    targetType: 'promo',
    summary: ({ req, res }) => `${Object.keys(req.body).length === 1 && typeof req.body.active === 'boolean' ? (req.body.active ? 'Activated' : 'Deactivated') : 'Updated'} promo code ${String(res?.code ?? req.params.id)}`,
  })
  @Patch(':id')
  @ApiOperation({ summary: 'Update or (de)activate a promo code (admin only)' })
  async update(@Param('id') id: string, @Body() body: PromoInput) {
    return this.promosService.update(id, body);
  }

  @Audited({
    action: 'promo.delete',
    targetType: 'promo',
    summary: ({ req, res }) => `Deleted promo code ${String(res?.code ?? req.params.id)}`,
  })
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an unused promo code (admin only)' })
  async remove(@Param('id') id: string) {
    return this.promosService.remove(id);
  }
}
