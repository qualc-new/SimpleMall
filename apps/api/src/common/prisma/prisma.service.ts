import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** 云托管未配置或仍为占位符时跳过连接，保证 /health 探活可用 */
function isDatabaseUrlReady(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && !url.includes('[YOUR-PASSWORD]'));
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (!isDatabaseUrlReady()) {
      this.logger.warn('DATABASE_URL 未配置或为占位符，跳过 Prisma 连接（请配置云托管环境变量）');
      return;
    }
    try {
      await this.$connect();
      this.logger.log('Prisma 已连接');
    } catch (err: any) {
      this.logger.error(`Prisma 连接失败（服务继续启动，健康检查可用）: ${err.message}`);
      // 不 throw，允许 /health 探活通过；业务接口调用时重试
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
