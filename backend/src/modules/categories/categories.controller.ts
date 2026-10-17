import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService, type CategoryInput } from './categories.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get category tree' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Audited({
    action: 'category.create',
    targetType: 'category',
    target: ({ res }) => res?.id as string | undefined,
    summary: ({ res }) => `Created category "${String(res?.name ?? '')}"`,
  })
  @Post()
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category (admin only)' })
  async create(@Body() body: CategoryInput) {
    return this.categoriesService.create(body);
  }

  @Audited({
    action: 'category.update',
    targetType: 'category',
    summary: ({ req, res }) => `Updated category "${String(res?.name ?? req.params.id)}"`,
  })
  @Patch(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin only)' })
  async update(@Param('id') id: string, @Body() body: CategoryInput) {
    return this.categoriesService.update(id, body);
  }

  @Audited({
    action: 'category.delete',
    targetType: 'category',
    summary: ({ req, res }) => `Deleted category ${String(res?.name ?? req.params.id)}`,
  })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an empty category (admin only)' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
