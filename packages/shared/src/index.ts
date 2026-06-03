/** 与 docs/共享接口与约定.md 保持同步 */

export enum OrderStatus {
  PENDING_PAY = "PENDING_PAY",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REFUNDING = "REFUNDING",
  REFUNDED = "REFUNDED",
}

export enum PayChannel {
  ALIPAY = "ALIPAY",
  WECHAT = "WECHAT",
}

export enum PaymentStatus {
  INIT = "INIT",
  SUCCESS = "SUCCESS",
  CLOSED = "CLOSED",
}

export enum SpuStatus {
  DRAFT = "DRAFT",
  ON_SALE = "ON_SALE",
  OFF_SALE = "OFF_SALE",
}

export enum AdminRole {
  SUPER = "SUPER",
  OPERATOR = "OPERATOR",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAY]: "待支付",
  [OrderStatus.PAID]: "已支付",
  [OrderStatus.SHIPPED]: "已发货",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.REFUNDING]: "退货中",
  [OrderStatus.REFUNDED]: "已退货",
};

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
