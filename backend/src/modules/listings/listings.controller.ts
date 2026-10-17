import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all listings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'sellerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'condition', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brand') brand?: string,
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('condition') condition?: string,
    @Query('sort') sort?: string,
  ) {
    return this.listingsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId,
      brand,
      sellerId,
      status,
      search,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      condition,
      sort,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single listing' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Audited({
    action: 'listing.create',
    targetType: 'listing',
    target: ({ res }) => res?.id as string | undefined,
    summary: ({ res }) => `Created listing "${String(res?.title ?? '')}"`,
  })
  @Post()
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing' })
  async create(@Body() body: Record<string, unknown>) {
    return this.listingsService.create(body);
  }

  @Audited({
    action: 'listing.update',
    targetType: 'listing',
    summary: ({ req, res }) => `Updated listing "${String(res?.title ?? req.params.id)}"`,
  })
  @Put(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.listingsService.update(id, body);
  }

  @Audited({
    action: 'listing.delete',
    targetType: 'listing',
    summary: ({ req }) => `Deleted listing ${req.params.id}`,
  })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing' })
  async remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }
}
