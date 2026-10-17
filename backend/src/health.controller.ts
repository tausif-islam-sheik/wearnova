import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check — verifies server and database are reachable' })
  async check(): Promise<{ status: string; database: string; timestamp: string }> {
    let database: string;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'disconnected';
    }

    return {
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
