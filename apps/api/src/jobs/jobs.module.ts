import { Module } from '@nestjs/common';
import { OrderTimeoutJob } from './order-timeout.job';
import { OrderAutoCompleteJob } from './order-auto-complete.job';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { OrderModule } from '../modules/order/order.module';

@Module({
  imports: [InventoryModule, OrderModule],
  providers: [OrderTimeoutJob, OrderAutoCompleteJob],
})
export class JobsModule {}
