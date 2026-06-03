/** SPU 商品状态 — 与 docs/共享接口与约定.md 保持同步 */

export enum SpuStatus {
  /** 未上架：仅后台可见，C 端不可见 */
  NOT_LISTED = 'NOT_LISTED',
  /** 已上架：C 端可见可购（有库存时） */
  ON_SALE = 'ON_SALE',
  /** 已售罄：C 端可见不可购，通常由库存为 0 自动同步 */
  SOLD_OUT = 'SOLD_OUT',
  /** 已下架：C 端不可见 */
  OFF_SALE = 'OFF_SALE',
  /** 补货中：C 端可见不可购，待补货 */
  RESTOCKING = 'RESTOCKING',
}

/** @deprecated 使用 NOT_LISTED */
export const SpuStatusDraft = 'DRAFT' as const;

export const SPU_STATUS_LABEL: Record<SpuStatus, string> = {
  [SpuStatus.NOT_LISTED]: '未上架',
  [SpuStatus.ON_SALE]: '已上架',
  [SpuStatus.SOLD_OUT]: '已售罄',
  [SpuStatus.OFF_SALE]: '已下架',
  [SpuStatus.RESTOCKING]: '补货中',
};

/** C 端列表/详情可见的状态 */
export const SPU_STOREFRONT_VISIBLE: SpuStatus[] = [
  SpuStatus.ON_SALE,
  SpuStatus.SOLD_OUT,
  SpuStatus.RESTOCKING,
];

/** 可加入购物车、下单的状态（仍需 SKU 库存 > 0） */
export const SPU_PURCHASABLE: SpuStatus[] = [SpuStatus.ON_SALE];

/** 将历史 DRAFT 映射为未上架 */
export function normalizeSpuStatus(status: string): SpuStatus {
  if (status === 'DRAFT') return SpuStatus.NOT_LISTED;
  if (Object.values(SpuStatus).includes(status as SpuStatus)) return status as SpuStatus;
  return SpuStatus.NOT_LISTED;
}

export function isSpuStorefrontVisible(status: string): boolean {
  return SPU_STOREFRONT_VISIBLE.includes(normalizeSpuStatus(status));
}

export function isSpuPurchasable(status: string, availableStock: number): boolean {
  return SPU_PURCHASABLE.includes(normalizeSpuStatus(status)) && availableStock > 0;
}

/** 统计 SPU 下可售 SKU 总可用库存（stock - reserved） */
export function totalAvailableStock(
  skus: Array<{ stock: number; reserved?: number; status?: string }>,
): number {
  return skus
    .filter((s) => s.status !== 'DISABLED')
    .reduce((sum, s) => sum + Math.max(0, s.stock - (s.reserved ?? 0)), 0);
}

/**
 * 库存变更后根据规则同步 SPU 状态（不覆盖未上架/已下架/补货中的手动设定，仅处理已上架↔已售罄）
 */
export function syncSpuStatusByStock(current: string, totalStock: number): SpuStatus {
  const status = normalizeSpuStatus(current);

  if (status === SpuStatus.NOT_LISTED || status === SpuStatus.OFF_SALE) {
    return status;
  }

  if (status === SpuStatus.RESTOCKING) {
    return totalStock > 0 ? SpuStatus.ON_SALE : SpuStatus.RESTOCKING;
  }

  if (totalStock <= 0) {
    if (status === SpuStatus.ON_SALE) return SpuStatus.SOLD_OUT;
    return status;
  }

  if (status === SpuStatus.SOLD_OUT) return SpuStatus.ON_SALE;
  return status;
}
