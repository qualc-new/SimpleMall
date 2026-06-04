import { SpuStatus, syncSpuStatusByStock, totalAvailableStock } from '@simplemall/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';

/** 按 SKU 库存同步 SPU 状态（已上架 ↔ 已售罄；补货中且有库存 → 已上架） */
export async function syncSpuStatusAfterStockChange(prisma: PrismaService, spuId: number) {
  const spu = await prisma.spu.findUnique({
    where: { id: spuId },
    include: { skus: true },
  });
  if (!spu) return null;

  const stock = totalAvailableStock(spu.skus);
  const next = syncSpuStatusByStock(spu.status, stock);
  const unchanged = next === spu.status && spu.totalStock === stock;
  if (unchanged) return spu;

  return prisma.spu.update({
    where: { id: spuId },
    data: { status: next, totalStock: stock },
    include: { skus: true, category: true },
  });
}

export const SPU_STOREFRONT_WHERE = {
  status: { in: [SpuStatus.ON_SALE, SpuStatus.SOLD_OUT, SpuStatus.RESTOCKING] },
};
