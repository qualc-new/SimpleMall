import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [OrderModule, PaymentModule, CatalogModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
