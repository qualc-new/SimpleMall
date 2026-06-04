import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../../core/auth/auth.service';
import { UserLoginDto } from '../../core/auth/dto/login.dto';
import { UserRegisterDto } from '../../core/auth/dto/register.dto';

/** C 端：注册与登录 */
@Controller()
export class WebAuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('auth/register')
  register(@Body() dto: UserRegisterDto) {
    return this.auth.userRegister(dto);
  }

  @Public()
  @Post('auth/login')
  userLogin(@Body() dto: UserLoginDto) {
    return this.auth.userLogin(dto);
  }
}
