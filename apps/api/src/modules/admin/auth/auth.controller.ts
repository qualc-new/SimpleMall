import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../../core/auth/auth.service';
import { AdminLoginDto } from '../../core/auth/dto/login.dto';

/** 管理端：登录 */
@Controller()
export class AdminAuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('admin/auth/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto);
  }
}
