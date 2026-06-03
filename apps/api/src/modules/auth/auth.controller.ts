import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AdminLoginDto, UserLoginDto } from './dto/login.dto';
import { UserRegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
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

  @Public()
  @Post('admin/auth/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto);
  }
}
