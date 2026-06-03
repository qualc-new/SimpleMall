import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { SpuStatus, isSpuPurchasable, normalizeSpuStatus } from '@simplemall/shared';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { sku: { include: { spu: true } } },
    });

    return items.map((row) => {
      const spuStatus = normalizeSpuStatus(row.sku.spu.status);
      const valid =
        row.sku.status === 'ENABLED' &&
        isSpuPurchasable(spuStatus, row.sku.stock);
      const invalidReason = valid
        ? undefined
        : spuStatus === SpuStatus.SOLD_OUT
          ? '商品已售罄'
          : spuStatus === SpuStatus.RESTOCKING
            ? '商品补货中'
            : '商品失效或库存不足';
      return {
        id: row.id,
        skuId: row.skuId,
        quantity: row.quantity,
        selected: row.selected,
        valid,
        invalidReason,
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
    if (!sku || !isSpuPurchasable(sku.spu.status, sku.stock)) {
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
