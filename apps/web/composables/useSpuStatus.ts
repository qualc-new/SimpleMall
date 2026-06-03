import {
  SPU_STATUS_LABEL,
  SpuStatus,
  isSpuPurchasable,
  normalizeSpuStatus,
} from '@simplemall/shared';

export function useSpuStatus() {
  const label = (status: string) => SPU_STATUS_LABEL[normalizeSpuStatus(status)] ?? status;

  const badgeClass = (status: string) => {
    const s = normalizeSpuStatus(status);
    const map: Record<SpuStatus, string> = {
      [SpuStatus.NOT_LISTED]: 'bg-gray-100 text-gray-600',
      [SpuStatus.ON_SALE]: 'bg-emerald-100 text-emerald-800',
      [SpuStatus.SOLD_OUT]: 'bg-red-100 text-red-700',
      [SpuStatus.OFF_SALE]: 'bg-gray-100 text-gray-500',
      [SpuStatus.RESTOCKING]: 'bg-amber-100 text-amber-800',
    };
    return map[s] ?? 'bg-gray-100 text-gray-600';
  };

  const canPurchase = (status: string, stock: number) => isSpuPurchasable(status, stock);

  const purchaseHint = (status: string, stock: number) => {
    const s = normalizeSpuStatus(status);
    if (isSpuPurchasable(s, stock)) return '';
    if (s === SpuStatus.SOLD_OUT) return '商品已售罄';
    if (s === SpuStatus.RESTOCKING) return '商品补货中，暂不可购买';
    return '暂不可购买';
  };

  return { label, badgeClass, canPurchase, purchaseHint };
}
