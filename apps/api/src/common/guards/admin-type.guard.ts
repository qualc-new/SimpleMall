import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BizError } from '../exceptions/business.exception';

@Injectable()
export class AdminTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.type !== 'admin') throw BizError.forbidden();
    return true;
  }
}
