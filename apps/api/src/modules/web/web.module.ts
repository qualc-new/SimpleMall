import { Module } from '@nestjs/common';
import { CatalogCoreModule } from '../core/catalog/catalog-core.module';
import { CartCoreModule } from '../core/cart/cart-core.module';
import { OrderCoreModule } from '../core/order/order-core.module';
import { PaymentCoreModule } from '../core/payment/payment-core.module';
import { UserCoreModule } from '../core/user/user-core.module';
import { ChatCoreModule } from '../core/chat/chat.module';
import { WebAuthController } from './auth/auth.controller';
import { CatalogController } from './catalog/catalog.controller';
import { CartController } from './cart/cart.controller';
import { OrderController } from './order/order.controller';
import { PaymentController } from './payment/payment.controller';
import { AddressController } from './user/address.controller';
import { ChatController } from './chat/chat.controller';

/** C 端 Web 接口入口 */
@Module({
  imports: [
    CatalogCoreModule,
    CartCoreModule,
    OrderCoreModule,
    PaymentCoreModule,
    UserCoreModule,
    ChatCoreModule,
  ],
  controllers: [
    WebAuthController,
    CatalogController,
    CartController,
    OrderController,
    PaymentController,
    AddressController,
    ChatController,
  ],
})
export class WebModule {}
