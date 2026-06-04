import { Module } from '@nestjs/common';
import { OrderTimeoutJob } from './order-timeout.job';
import { OrderAutoCompleteJob } from './order-auto-complete.job';
import { InventoryCoreModule } from '../modules/core/inventory/inventory-core.module';
import { OrderCoreModule } from '../modules/core/order/order-core.module';

@Module({
  imports: [InventoryCoreModule, OrderCoreModule],
  providers: [OrderTimeoutJob, OrderAutoCompleteJob],
})
export class JobsModule {}
