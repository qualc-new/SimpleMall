import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { InventoryCoreModule } from '../inventory/inventory-core.module';

@Module({
  imports: [InventoryCoreModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderCoreModule {}
