import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BizError } from '../exceptions/business.exception';

@Injectable()
export class UserTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.type !== 'user') throw BizError.forbidden();
    return true;
  }
}
