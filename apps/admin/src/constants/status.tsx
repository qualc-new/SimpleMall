import { Tag } from 'antd';
import { ORDER_STATUS_LABEL, OrderStatus, SPU_STATUS_LABEL, SpuStatus, normalizeSpuStatus } from '@simplemall/shared';

const SPU_STATUS_COLOR: Record<SpuStatus, string> = {
  [SpuStatus.NOT_LISTED]: 'default',
  [SpuStatus.ON_SALE]: 'success',
  [SpuStatus.SOLD_OUT]: 'error',
  [SpuStatus.OFF_SALE]: 'default',
  [SpuStatus.RESTOCKING]: 'processing',
};

const ORDER_STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PENDING_PAY]: 'gold',
  [OrderStatus.PAID]: 'processing',
  [OrderStatus.SHIPPED]: 'cyan',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'default',
  [OrderStatus.REFUNDING]: 'orange',
  [OrderStatus.REFUNDED]: 'purple',
};

export function SpuStatusTag({ status }: { status: string }) {
  const normalized = normalizeSpuStatus(status);
  const label = SPU_STATUS_LABEL[normalized] ?? status;
  const color = SPU_STATUS_COLOR[normalized] ?? 'default';
  return <Tag color={color}>{label}</Tag>;
}

export const SPU_STATUS_OPTIONS = Object.values(SpuStatus).map((value) => ({
  value,
  label: SPU_STATUS_LABEL[value],
}));

export function OrderStatusTag({ status }: { status: string }) {
  const color = ORDER_STATUS_COLOR[status as OrderStatus] ?? 'default';
  const label = ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
  return <Tag color={color}>{label}</Tag>;
}
