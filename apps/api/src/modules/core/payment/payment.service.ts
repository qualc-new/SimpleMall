import { createHmac, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { OrderStatus, PayChannel, PaymentStatus } from '@simplemall/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { BizError } from '../../../common/exceptions/business.exception';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private inventory: InventoryService,
  ) {}

  async create(userId: number, orderId: number, channel: PayChannel) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order || order.status !== OrderStatus.PENDING_PAY) {
      throw BizError.notFound('订单不可支付');
    }

    const paymentNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        paymentNo,
        orderId,
        channel,
        amount: order.payAmount,
        status: PaymentStatus.INIT,
      },
      update: { channel, status: PaymentStatus.INIT },
    });

    const base = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';
    const payUrl = `${base}/api/v1/mock-pay?paymentNo=${paymentNo}`;
    return { paymentNo, payUrl };
  }

  verifySign(rawBody: string, sign: string) {
    const secret = process.env.MOCK_PAY_SIGN_SECRET ?? 'dev_mock_sign';
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === sign;
  }

  async handleNotify(body: { paymentNo: string; success?: boolean }) {
    const key = `pay:notify:${body.paymentNo}`;
    const client = this.redis.getClient();
    const exists = await client.get(key);
    if (exists) return { duplicate: true };

    const payment = await this.prisma.payment.findUnique({
      where: { paymentNo: body.paymentNo },
      include: { order: true },
    });
    if (!payment) throw BizError.notFound('支付单不存在');
    if (payment.status === PaymentStatus.SUCCESS) {
      await client.set(key, '1', 'EX', 86400);
      return { ok: true };
    }

    if (body.success === false) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CLOSED, notifyRaw: body },
      });
      return { ok: false };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
          notifyRaw: body,
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: payment.orderId,
          fromStatus: OrderStatus.PENDING_PAY,
          toStatus: OrderStatus.PAID,
          operator: 'payment',
        },
      });
    });

    await this.inventory.confirmByOrder(payment.orderId);
    await client.set(key, '1', 'EX', 86400);
    return { ok: true };
  }

  signBody(raw: string) {
    const secret = process.env.MOCK_PAY_SIGN_SECRET ?? 'dev_mock_sign';
    return createHmac('sha256', secret).update(raw).digest('hex');
  }

  genPaymentNo() {
    return `PAY${Date.now()}`;
  }
}
