import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@simplemall/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { OrderService } from '../core/order/order.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private order: OrderService,
  ) {}

  async listOrders(query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = query.status ? { status: query.status } : {};
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async ship(orderId: number, company: string, trackingNo: string) {
    await this.order.transition(orderId, OrderStatus.SHIPPED, 'admin');
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        logisticsJson: { company, trackingNo, shippedAt: new Date().toISOString() },
      },
    });
  }
}
