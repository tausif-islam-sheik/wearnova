import { Body, Controller, Delete, Get, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { Audited } from '@/modules/audit/audited.decorator';
import { BackupsService, type BackupSettings } from './backups.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt-admin'))
@Controller('admin/backups')
export class BackupsController {
  constructor(private readonly backups: BackupsService) {}

  @Get()
  @ApiOperation({ summary: 'List database backups with the automatic backup schedule' })
  async overview() {
    const [settings, backups] = await Promise.all([this.backups.getSettings(), this.backups.list()]);
    return {
      settings,
      backups,
      nextRunAt: await this.backups.nextRunAt(settings, backups),
    };
  }

  @Audited({
    action: 'backup.create',
    targetType: 'backup',
    target: ({ res }) => (res as { name?: string } | undefined)?.name,
    summary: () => 'Created a manual database backup',
  })
  @Post()
  @ApiOperation({ summary: 'Create a database backup now' })
  create() {
    return this.backups.create('manual');
  }

  @Audited({
    action: 'backup.settings',
    targetType: 'backup',
    target: () => 'schedule',
    summary: ({ req }) =>
      req.body.enabled === false
        ? 'Turned automatic database backups off'
        : 'Updated the automatic database backup schedule',
  })
  @Put('settings')
  @ApiOperation({ summary: 'Update the automatic backup schedule' })
  updateSettings(@Body() dto: Partial<BackupSettings>) {
    return this.backups.updateSettings(dto);
  }

  @Get(':name/download')
  @ApiOperation({ summary: 'Download a backup file' })
  async download(@Param('name') name: string, @Res() res: Response) {
    const path = await this.backups.assertExists(name);
    res.download(path, name);
  }

  @Audited({
    action: 'backup.delete',
    targetType: 'backup',
    target: ({ req }) => req.params.name,
    summary: ({ req }) => `Deleted database backup ${req.params.name}`,
  })
  @Delete(':name')
  @ApiOperation({ summary: 'Delete a backup file' })
  remove(@Param('name') name: string) {
    return this.backups.remove(name);
  }
}
