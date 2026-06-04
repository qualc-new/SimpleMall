import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { BizError } from '../../../common/exceptions/business.exception';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async checkAvailable(skuId: number, qty: number) {
    const sku = await this.prisma.sku.findUnique({ where: { id: skuId } });
    return !!sku && sku.stock >= qty && sku.status === 'ENABLED';
  }

  async reserveForOrder(
    orderId: number,
    items: { skuId: number; qty: number }[],
    expireMinutes = 30,
  ) {
    const expireAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const lockKey = `lock:sku:${item.skuId}`;
        try {
          const locked = await this.redis.getClient().set(lockKey, '1', 'EX', 3, 'NX');
          if (locked === null) throw BizError.insufficientStock();
        } catch (e) {
          if (e && typeof e === 'object' && 'businessCode' in (e as object)) throw e;
        }

        const sku = await tx.sku.findUnique({ where: { id: item.skuId } });
        if (!sku || sku.stock < item.qty) throw BizError.insufficientStock();

        const updated = await tx.sku.updateMany({
          where: { id: item.skuId, stock: { gte: item.qty }, version: sku.version },
          data: {
            stock: { decrement: item.qty },
            reserved: { increment: item.qty },
            version: { increment: 1 },
          },
        });
        if (updated.count === 0) throw BizError.insufficientStock();

        await tx.inventoryReservation.create({
          data: {
            orderId,
            skuId: item.skuId,
            quantity: item.qty,
            expireAt,
          },
        });

        try {
          const client = this.redis.getClient();
          await client.del(lockKey);
        } catch {
          /* ignore */
        }
      }
    });
  }

  async restockByOrder(orderId: number) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.sku.update({
          where: { id: item.skuId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  }

  async releaseByOrder(orderId: number) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId },
    });
    if (!reservations.length) return;

    await this.prisma.$transaction(async (tx) => {
      for (const r of reservations) {
        await tx.sku.update({
          where: { id: r.skuId },
          data: {
            stock: { increment: r.quantity },
            reserved: { decrement: r.quantity },
          },
        });
      }
      await tx.inventoryReservation.deleteMany({ where: { orderId } });
    });
  }

  async confirmByOrder(orderId: number) {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { orderId },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const r of reservations) {
        await tx.sku.update({
          where: { id: r.skuId },
          data: { reserved: { decrement: r.quantity } },
        });
      }
      await tx.inventoryReservation.deleteMany({ where: { orderId } });
    });
  }
}
