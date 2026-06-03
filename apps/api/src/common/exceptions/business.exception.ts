import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public readonly businessCode: number,
    message: string,
    status: HttpStatus = HttpStatus.CONFLICT,
  ) {
    super({ code: businessCode, message }, status);
  }
}

export const BizError = {
  unauthorized: () => new BusinessException(40100, '未登录', HttpStatus.UNAUTHORIZED),
  forbidden: () => new BusinessException(40300, '无权限', HttpStatus.FORBIDDEN),
  notFound: (msg = '资源不存在') =>
    new BusinessException(40400, msg, HttpStatus.NOT_FOUND),
  invalidOrderState: () => new BusinessException(40901, '订单状态非法'),
  insufficientStock: () => new BusinessException(40902, '库存不足'),
};
