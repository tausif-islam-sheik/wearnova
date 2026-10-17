import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'List all banners' })
  async findAll() {
    return this.bannersService.findAll();
  }

  @Audited({
    action: 'banner.create',
    targetType: 'banner',
    target: ({ res }) => res?.id as string | undefined,
    summary: ({ res }) => `Created banner "${String(res?.title ?? '')}"`,
  })
  @Post()
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new banner' })
  async create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Audited({
    action: 'banner.update',
    targetType: 'banner',
    summary: ({ req, res }) => `Updated banner "${String(res?.title ?? req.params.id)}"`,
  })
  @Put(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a banner' })
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Audited({
    action: 'banner.delete',
    targetType: 'banner',
    summary: ({ req }) => `Deleted banner ${req.params.id}`,
  })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a banner' })
  async remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }

  @Audited({
    action: 'banner.reorder',
    targetType: 'banner',
    summary: ({ req }) => `Moved banner ${(req.params.id ?? '').slice(-8)} ${String(req.body.direction)}`,
  })
  @Patch(':id/reorder')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder a banner (up/down)' })
  async reorder(@Param('id') id: string, @Body('direction') direction: 'up' | 'down') {
    return this.bannersService.reorder(id, direction);
  }

  @Audited({
    action: 'banner.toggle',
    targetType: 'banner',
    summary: ({ req, res }) => `${res?.active ? 'Activated' : 'Deactivated'} banner "${String(res?.title ?? (req.params.id ?? '').slice(-8))}"`,
  })
  @Patch(':id/toggle')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle banner active status' })
  async toggle(@Param('id') id: string) {
    return this.bannersService.toggle(id);
  }
}
