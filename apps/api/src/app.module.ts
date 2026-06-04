import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthCoreModule } from './modules/core/auth/auth-core.module';
import { WebModule } from './modules/web/web.module';
import { AdminModule } from './modules/admin/admin.module';
import { JobsModule } from './jobs/jobs.module';

/** 云托管多副本时可设 ENABLE_CRON=false，避免定时任务重复执行 */
const cronEnabled = process.env.ENABLE_CRON !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(cronEnabled ? [ScheduleModule.forRoot(), JobsModule] : []),
    PrismaModule,
    RedisModule,
    AuthCoreModule,
    WebModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
