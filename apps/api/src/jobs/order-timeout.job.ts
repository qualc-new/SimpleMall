import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus } from '@simplemall/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { InventoryService } from '../modules/inventory/inventory.service';

@Injectable()
export class OrderTimeoutJob {
  private readonly log = new Logger(OrderTimeoutJob.name);

  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  @Cron('*/5 * * * *')
  async closeExpiredOrders() {
    const minutes = Number(process.env.ORDER_PAY_TIMEOUT_MINUTES ?? 30);
    const before = new Date(Date.now() - minutes * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING_PAY, createdAt: { lt: before } },
      take: 50,
    });

    for (const order of orders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      await this.prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING_PAY,
          toStatus: OrderStatus.CANCELLED,
          operator: 'cron',
          remark: '支付超时',
        },
      });
      await this.inventory.releaseByOrder(order.id);
      this.log.log(`Closed order ${order.orderNo}`);
    }
  }
}
