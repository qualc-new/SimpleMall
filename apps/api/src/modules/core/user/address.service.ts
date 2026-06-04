import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BizError } from '../../../common/exceptions/business.exception';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  list(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
  }

  async create(
    userId: number,
    data: {
      name: string;
      phone: string;
      province: string;
      city: string;
      district: string;
      detail: string;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  async update(
    userId: number,
    id: number,
    data: Partial<{
      name: string;
      phone: string;
      province: string;
      city: string;
      district: string;
      detail: string;
      isDefault: boolean;
    }>,
  ) {
    const row = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!row) throw BizError.notFound();
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id }, data });
  }

  async remove(userId: number, id: number) {
    const row = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!row) throw BizError.notFound();
    await this.prisma.address.delete({ where: { id } });
    return { ok: true };
  }
}
