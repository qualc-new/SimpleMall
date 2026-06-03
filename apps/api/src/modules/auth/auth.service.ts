import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError, BusinessException } from '../../common/exceptions/business.exception';
import { HttpStatus } from '@nestjs/common';
import { AdminLoginDto, UserLoginDto } from './dto/login.dto';
import { UserRegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async userRegister(dto: UserRegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) {
      throw new BusinessException(42200, '手机号已注册', HttpStatus.BAD_REQUEST);
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        password: hash,
        nickname: dto.nickname ?? `用户${dto.phone.slice(-4)}`,
      },
    });
    const accessToken = this.jwt.sign({ sub: user.id, type: 'user' });
    return {
      accessToken,
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
    };
  }

  async userLogin(dto: UserLoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw BizError.unauthorized();
    }
    const accessToken = this.jwt.sign({ sub: user.id, type: 'user' });
    return {
      accessToken,
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { username: dto.username } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.password))) {
      throw BizError.unauthorized();
    }
    const accessToken = this.jwt.sign({
      sub: admin.id,
      type: 'admin',
      role: admin.role,
    });
    return {
      accessToken,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    };
  }
}
