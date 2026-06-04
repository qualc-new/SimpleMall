import { HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus } from '@simplemall/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BizError, BusinessException } from '../../../common/exceptions/business.exception';
import { assertOrderTransition } from '../../../common/order-state.machine';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  private genOrderNo() {
    return `SM${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  async create(
    userId: number,
    body: {
      addressId: number;
      cartItemIds?: number[];
      directBuy?: { skuId: number; quantity: number };
      remark?: string;
    },
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id: body.addressId, userId },
    });
    if (!address) throw BizError.notFound('地址不存在');

    let lines: { skuId: number; quantity: number; sku: Awaited<ReturnType<typeof this.loadSku>> }[] = [];

    if (body.directBuy) {
      const sku = await this.loadSku(body.directBuy.skuId);
      lines = [{ skuId: sku.id, quantity: body.directBuy.quantity, sku }];
    } else if (body.cartItemIds?.length) {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId, id: { in: body.cartItemIds }, selected: true },
        include: { sku: { include: { spu: true } } },
      });
      if (!cartItems.length) throw BizError.notFound('购物车项无效');
      lines = cartItems.map((c) => ({
        skuId: c.skuId,
        quantity: c.quantity,
        sku: c.sku,
      }));
    } else {
      throw BizError.notFound('请选择商品');
    }

    const totalAmount = lines.reduce((s, l) => s + l.sku.price * l.quantity, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo: this.genOrderNo(),
          userId,
          status: OrderStatus.PENDING_PAY,
          totalAmount,
          payAmount: totalAmount,
          remark: body.remark,
          addressJson: address,
          items: {
            create: lines.map((l) => ({
              skuId: l.skuId,
              spuTitle: l.sku.spu.title,
              specsJson: l.sku.specsJson,
              unitPrice: l.sku.price,
              quantity: l.quantity,
            })),
          },
          statusLogs: {
            create: { toStatus: OrderStatus.PENDING_PAY, operator: 'system' },
          },
        },
        include: { items: true },
      });
      return created;
    });

    await this.inventory.reserveForOrder(
      order.id,
      lines.map((l) => ({ skuId: l.skuId, qty: l.quantity })),
    );

    if (body.cartItemIds?.length) {
      await this.prisma.cartItem.deleteMany({
        where: { userId, id: { in: body.cartItemIds } },
      });
    }

    return { id: order.id, orderNo: order.orderNo, status: order.status, payAmount: order.payAmount };
  }

  private async loadSku(skuId: number) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { spu: true },
    });
    if (!sku) throw BizError.notFound('SKU 不存在');
    return sku;
  }

  async list(userId: number, status?: string, page = 1, pageSize = 20) {
    const where = { userId, ...(status ? { status } : {}) };
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      list: list.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        totalAmount: o.totalAmount,
        payAmount: o.payAmount,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
      total,
      page,
      pageSize,
    };
  }

  async detail(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { sku: { include: { spu: true } } } },
        payment: true,
        statusLogs: { orderBy: { id: 'asc' } },
      },
    });
    if (!order) throw BizError.notFound();

    // 为每个订单行附加 SPU 层信息（主图、轮播、市场价、运费、服务保障等）
    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        spuImage: item.sku.spu.mainImage,
        spuImages: (item.sku.spu.imagesJson as string[]) ?? [],
        spuMarketPrice: item.sku.spu.marketPrice,
        spuFreightType: item.sku.spu.freightType,
        spuExpressId: item.sku.spu.expressId,
        spuServiceList: item.sku.spu.serviceList,
      })),
    };
  }

  async cancel(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw BizError.notFound();
    assertOrderTransition(order.status, OrderStatus.CANCELLED);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          operator: 'user',
        },
      });
    });
    await this.inventory.releaseByOrder(id);
    return { ok: true };
  }

  async transition(orderId: number, to: OrderStatus, operator: string, remark?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw BizError.notFound();
    assertOrderTransition(order.status, to);
    await this.prisma.order.update({ where: { id: orderId }, data: { status: to } });
    await this.prisma.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: to,
        operator,
        remark: remark?.trim() || null,
      },
    });
    return order;
  }

  async requestRefund(userId: number, id: number, reason: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw BizError.notFound();
    assertOrderTransition(order.status, OrderStatus.REFUNDING);
    await this.transition(id, OrderStatus.REFUNDING, 'user', reason);
    return { ok: true };
  }

  async confirmReceive(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw BizError.notFound();
    assertOrderTransition(order.status, OrderStatus.COMPLETED);
    await this.transition(id, OrderStatus.COMPLETED, 'user');
    return { ok: true };
  }

  async adminDetail(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        statusLogs: { orderBy: { id: 'asc' } },
      },
    });
    if (!order) throw BizError.notFound();
    return order;
  }

  async processRefund(orderId: number, approve: boolean, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== OrderStatus.REFUNDING) throw BizError.invalidOrderState();

    const remark = reason?.trim();
    if (!approve && !remark) {
      throw new BusinessException(42200, '拒绝退货须填写原因', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (!approve) {
      const rollback = order.logisticsJson ? OrderStatus.SHIPPED : OrderStatus.PAID;
      await this.transition(orderId, rollback, 'admin', remark);
      return { ok: true, status: rollback };
    }

    await this.transition(orderId, OrderStatus.REFUNDED, 'admin', remark || undefined);
    await this.inventory.restockByOrder(orderId);
    return { ok: true, status: OrderStatus.REFUNDED };
  }
}
