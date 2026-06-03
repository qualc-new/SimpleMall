/** SPU 列表：SKU 售价区间（分） */
export function spuPriceRange(skus: Array<{ price: number; status?: string }>): string {
  const active = skus.filter((s) => s.status !== 'DISABLED');
  if (!active.length) return '—';
  const prices = active.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return String(min);
  return `${min}~${max}`;
}
