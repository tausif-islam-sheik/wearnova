import { Module } from '@nestjs/common';
import { ListingsModule } from '@/modules/listings/listings.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [ListingsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
