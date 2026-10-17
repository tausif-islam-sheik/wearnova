import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandsService, type BrandInput } from './brands.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'List all brands' })
  async findAll() {
    return this.brandsService.findAll();
  }

  @Audited({
    action: 'brand.create',
    targetType: 'brand',
    target: ({ res }) => res?.id as string | undefined,
    summary: ({ res }) => `Created brand "${String(res?.name ?? '')}"`,
  })
  @Post()
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a brand (admin only)' })
  async create(@Body() body: BrandInput) {
    return this.brandsService.create(body);
  }

  @Audited({
    action: 'brand.update',
    targetType: 'brand',
    summary: ({ req, res }) => `Updated brand "${String(res?.name ?? req.params.id)}"`,
  })
  @Patch(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand (admin only)' })
  async update(@Param('id') id: string, @Body() body: BrandInput) {
    return this.brandsService.update(id, body);
  }

  @Audited({
    action: 'brand.delete',
    targetType: 'brand',
    summary: ({ req, res }) => `Deleted brand ${String(res?.name ?? req.params.id)}`,
  })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an unused brand (admin only)' })
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
