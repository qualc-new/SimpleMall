import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BizError } from '../../../common/exceptions/business.exception';
import { UpdateAdminUserDto } from './dto/admin-user.dto';

/** 管理端：商城 C 端用户 */
@Injectable()
export class AdminUserService {
  constructor(private prisma: PrismaService) {}

  async listUsers(query: { page?: number; pageSize?: number; keyword?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          OR: [{ phone: { contains: keyword } }, { nickname: { contains: keyword } }],
        }
      : {};

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          phone: true,
          nickname: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { orders: true, addresses: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, addresses: true, cartItems: true } },
        addresses: {
          take: 5,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            name: true,
            phone: true,
            province: true,
            city: true,
            district: true,
            detail: true,
            isDefault: true,
          },
        },
      },
    });
    if (!user) throw BizError.notFound('用户不存在');
    return user;
  }

  async updateUser(id: number, dto: UpdateAdminUserDto) {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) throw BizError.notFound('用户不存在');
    return this.prisma.user.update({
      where: { id },
      data: { nickname: dto.nickname ?? row.nickname },
      select: {
        id: true,
        phone: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
