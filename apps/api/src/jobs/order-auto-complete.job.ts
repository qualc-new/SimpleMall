import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus } from '@simplemall/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderService } from '../modules/order/order.service';

@Injectable()
export class OrderAutoCompleteJob {
  private readonly log = new Logger(OrderAutoCompleteJob.name);

  constructor(
    private prisma: PrismaService,
    private order: OrderService,
  ) {}

  @Cron('0 3 * * *')
  async autoComplete() {
    const before = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.SHIPPED, updatedAt: { lt: before } },
      take: 100,
    });

    for (const o of orders) {
      try {
        await this.order.transition(o.id, OrderStatus.COMPLETED, 'cron');
        this.log.log(`Auto completed order ${o.orderNo}`);
      } catch {
        /* skip invalid transitions */
      }
    }
  }
}
