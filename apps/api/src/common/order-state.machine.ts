import { OrderStatus } from '@simplemall/shared';
import { BizError } from './exceptions/business.exception';

const ALLOWED: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING_PAY]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDING],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDING],
  [OrderStatus.REFUNDING]: [
    OrderStatus.REFUNDED,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
  ],
};

export function assertOrderTransition(from: string, to: OrderStatus) {
  const allowed = ALLOWED[from as OrderStatus];
  if (!allowed?.includes(to)) {
    throw BizError.invalidOrderState();
  }
}
