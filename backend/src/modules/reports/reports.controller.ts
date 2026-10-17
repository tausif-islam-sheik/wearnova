import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReportsService, type CreateReportInput, type UpdateReportInput } from './reports.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a listing or user to the moderators' })
  async create(@Body() body: CreateReportInput, @CurrentUser() user: { id: string }) {
    return this.reportsService.create(user.id, body);
  }

  @Get()
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reports (admin only)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('reason') reason?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      reason,
      search,
    });
  }

  @Audited({
    action: 'report.update',
    targetType: 'report',
    summary: ({ req }) => `Marked report ${(req.params.id ?? '').slice(-8)} as ${String(req.body.status)}${req.body.deactivateListing ? ' and deactivated the listing' : ''}`,
  })
  @Patch(':id')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve, dismiss or reopen a report (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateReportInput,
    @CurrentUser() admin: { id: string },
  ) {
    return this.reportsService.update(id, admin.id, body);
  }
}
