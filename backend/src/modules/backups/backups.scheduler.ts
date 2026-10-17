import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BackupsService } from './backups.service';

const CHECK_EVERY_MS = 60 * 1000;

/** Runs the automatic database backup when its schedule says it is due. */
@Injectable()
export class BackupsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupsScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly backups: BackupsService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.run(), CHECK_EVERY_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async run(): Promise<void> {
    try {
      await this.backups.runIfDue();
    } catch (error) {
      this.logger.error(
        `Automatic backup failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
