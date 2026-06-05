import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { RedisModule } from '../../../common/redis/redis.module';
import { CatalogCoreModule } from '../catalog/catalog-core.module';
import { OrderCoreModule } from '../order/order-core.module';
import { UserCoreModule } from '../user/user-core.module';
import { ChatService } from './chat.service';

/** AI 对话核心模块 */
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    OrderCoreModule,
    CatalogCoreModule,
    UserCoreModule,
  ],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatCoreModule {}
