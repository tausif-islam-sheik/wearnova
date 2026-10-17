import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Audited } from '@/modules/audit/audited.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getStats(@Query('period') period?: string) {
    const normalized = period === 'week' || period === 'year' ? period : 'month';
    return this.adminService.getStats(normalized);
  }

  @Get('analytics')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get advanced analytics data' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard sections: attention queue, money flow, pipeline, top lists, activity' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('revenue')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revenue chart data: week / month / year, or a custom from-to range' })
  async getRevenue(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getRevenue(period, from, to);
  }

  @Get('pending')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Counts of open reports and disputes waiting for review' })
  async getPending() {
    return this.adminService.getPending();
  }

  @Get('settings')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform settings (platform fee percent)' })
  async getSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Audited({
    action: 'settings.general',
    targetType: 'settings',
    target: () => 'general',
    summary: () => 'Updated general settings (name, email)',
  })
  @Put('settings/general')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform name and support email' })
  async updateGeneral(
    @Body() dto: { platformName?: string; supportEmail?: string },
  ) {
    return this.adminService.updateGeneralSettings(dto);
  }

  @Audited({
    action: 'settings.fee',
    targetType: 'settings',
    target: () => 'platform-fee',
    summary: ({ req }) => `Set the platform fee to ${String(req.body.platformFeePercent)}%`,
  })
  @Put('settings/platform-fee')
  @UseGuards(AuthGuard('jwt-admin'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform fee percent (0-50)' })
  async updatePlatformFee(@Body() dto: { platformFeePercent: number }) {
    return this.adminService.updatePlatformFeePercent(Number(dto.platformFeePercent));
  }
}
