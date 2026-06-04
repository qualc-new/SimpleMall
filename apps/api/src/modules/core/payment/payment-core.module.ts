import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InventoryCoreModule } from '../inventory/inventory-core.module';

@Module({
  imports: [InventoryCoreModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentCoreModule {}
