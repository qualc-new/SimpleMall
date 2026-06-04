import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../core/catalog/catalog-core.module';
import { OrderCoreModule } from '../core/order/order-core.module';
import { PaymentCoreModule } from '../core/payment/payment-core.module';
import { AdminAuthController } from './auth/auth.controller';
import { AdminBrandController } from './brand/brand.controller';
import { AdminCategoryController } from './category/category.controller';
import { AdminExpressController } from './express/express.controller';
import { AdminOrderController } from './order/order.controller';
import { AdminPaymentController } from './payment/payment.controller';
import { AdminServiceGuaranteeController } from './service-guarantee/service-guarantee.controller';
import { AdminSpuController } from './spu/spu.controller';
import { AdminTagController } from './tag/tag.controller';
import { AdminUploadController } from './upload/upload.controller';
import { AdminUserController } from './user/user.controller';
import { AdminService } from './admin.service';
import { AdminUploadService } from './admin-upload.service';
import { AdminUserService } from './user/admin-user.service';

/** 管理端接口入口（按业务模块拆分 Controller） */
@Module({
  imports: [CatalogCoreModule, OrderCoreModule, PaymentCoreModule],
  controllers: [
    AdminAuthController,
    AdminOrderController,
    AdminBrandController,
    AdminExpressController,
    AdminTagController,
    AdminServiceGuaranteeController,
    AdminUploadController,
    AdminCategoryController,
    AdminSpuController,
    AdminPaymentController,
    AdminUserController,
  ],
  providers: [AdminService, AdminUploadService, AdminUserService],
})
export class AdminModule {}
