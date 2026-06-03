import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { SpuStatus } from '@simplemall/shared';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { sku: { include: { spu: true } } },
    });

    return items.map((row) => {
      const valid =
        row.sku.status === 'ENABLED' &&
        row.sku.spu.status === SpuStatus.ON_SALE &&
        row.sku.stock > 0;
      return {
        id: row.id,
        skuId: row.skuId,
        quantity: row.quantity,
        selected: row.selected,
        valid,
        invalidReason: valid ? undefined : '商品失效或库存不足',
        sku: {
          id: row.sku.id,
          price: row.sku.price,
          stock: row.sku.stock,
          specs: row.sku.specsJson as Record<string, string>,
          spuTitle: row.sku.spu.title,
          mainImage: row.sku.spu.mainImage,
        },
      };
    });
  }

  async addItem(userId: number, skuId: number, quantity: number) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { spu: true },
    });
    if (!sku || sku.spu.status !== SpuStatus.ON_SALE) {
      throw BizError.notFound('商品不可购买');
    }
    const qty = Math.min(99, quantity, sku.stock);
    if (qty < 1) throw BizError.insufficientStock();

    return this.prisma.cartItem.upsert({
      where: { userId_skuId: { userId, skuId } },
      create: { userId, skuId, quantity: qty },
      update: { quantity: { increment: qty } },
    });
  }

  async updateItem(userId: number, id: number, data: { quantity?: number; selected?: boolean }) {
    const item = await this.prisma.cartItem.findFirst({ where: { id, userId } });
    if (!item) throw BizError.notFound();
    return this.prisma.cartItem.update({ where: { id }, data });
  }

  async removeItem(userId: number, id: number) {
    const item = await this.prisma.cartItem.findFirst({ where: { id, userId } });
    if (!item) throw BizError.notFound();
    await this.prisma.cartItem.delete({ where: { id } });
    return { ok: true };
  }
}
