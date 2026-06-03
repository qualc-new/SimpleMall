/** 商品标签状态 */

export enum TagStatus {
  /** 启用，可选入商品与 C 端展示 */
  ENABLED = 'ENABLED',
  /** 停用，不可新选入商品 */
  DISABLED = 'DISABLED',
}

export const TAG_STATUS_LABEL: Record<TagStatus, string> = {
  [TagStatus.ENABLED]: '启用',
  [TagStatus.DISABLED]: '停用',
};
