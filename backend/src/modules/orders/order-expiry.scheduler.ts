import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PENDING_ORDER_TTL_MINUTES } from './shipping.constants';

const RUN_EVERY_MS = 5 * 60 * 1000;

/** Cancels abandoned checkouts so their listings go back on sale. */
@Injectable()
export class OrderExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly orders: OrdersService) {}

  onModuleInit(): void {
    this.logger.log(`Pending orders expire after ${PENDING_ORDER_TTL_MINUTES} minutes`);
    this.timer = setInterval(() => void this.run(), RUN_EVERY_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async run(): Promise<void> {
    try {
      const count = await this.orders.expireStaleOrders();
      if (count > 0) this.logger.log(`Expired ${count} abandoned order(s)`);
    } catch (error) {
      this.logger.error(
        `Order expiry failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
