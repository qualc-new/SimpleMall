import { Injectable } from '@nestjs/common';
import { SpuStatus } from '@simplemall/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin-category.dto';
import { AdminCreateSpuDto, AdminUpdateSpuDto } from './dto/admin-spu.dto';

@Injectable()
export class AdminCatalogService {
  constructor(private prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    let path = '/';
    let level = 1;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw BizError.notFound('父类目不存在');
      path = `${parent.path}${parent.id}/`;
      level = parent.level + 1;
    }
    return this.prisma.category.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        sort: dto.sort ?? 0,
        path,
        level,
      },
    });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw BizError.notFound();
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: number) {
    const child = await this.prisma.category.count({ where: { parentId: id } });
    if (child > 0) throw BizError.notFound('存在子类目，无法删除');
    const spuCount = await this.prisma.spu.count({ where: { categoryId: id } });
    if (spuCount > 0) throw BizError.notFound('类目下存在商品');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  async createSpu(dto: AdminCreateSpuDto) {
    const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!cat) throw BizError.notFound('类目不存在');
    if (!dto.skus?.length) throw BizError.notFound('至少一个 SKU');

    return this.prisma.$transaction(async (tx) => {
      const spu = await tx.spu.create({
        data: {
          categoryId: dto.categoryId,
          title: dto.title,
          description: dto.description,
          mainImage: dto.mainImage,
          imagesJson: dto.images,
          status: dto.status,
        },
      });
      await tx.sku.createMany({
        data: dto.skus.map((s) => ({
          spuId: spu.id,
          specsJson: s.specs,
          price: s.price,
          stock: s.stock,
          barcode: s.barcode,
          status: 'ENABLED',
        })),
      });
      return tx.spu.findUnique({ where: { id: spu.id }, include: { skus: true } });
    });
  }

  async updateSpu(id: number, dto: AdminUpdateSpuDto) {
    const spu = await this.prisma.spu.findUnique({ where: { id }, include: { skus: true } });
    if (!spu) throw BizError.notFound();

    return this.prisma.$transaction(async (tx) => {
      await tx.spu.update({
        where: { id },
        data: {
          ...(dto.categoryId != null && { categoryId: dto.categoryId }),
          ...(dto.title != null && { title: dto.title }),
          ...(dto.description != null && { description: dto.description }),
          ...(dto.mainImage != null && { mainImage: dto.mainImage }),
          ...(dto.images != null && { imagesJson: dto.images }),
          ...(dto.status != null && { status: dto.status }),
        },
      });

      if (dto.skus) {
        const incomingIds = dto.skus.filter((s) => s.id).map((s) => s.id!);
        for (const old of spu.skus) {
          if (!incomingIds.includes(old.id)) {
            await tx.sku.update({ where: { id: old.id }, data: { status: 'DISABLED' } });
          }
        }
        for (const s of dto.skus) {
          if (s.id) {
            await tx.sku.update({
              where: { id: s.id },
              data: {
                specsJson: s.specs,
                price: s.price,
                stock: s.stock,
                barcode: s.barcode,
                status: 'ENABLED',
              },
            });
          } else {
            await tx.sku.create({
              data: {
                spuId: id,
                specsJson: s.specs,
                price: s.price,
                stock: s.stock,
                barcode: s.barcode,
                status: 'ENABLED',
              },
            });
          }
        }
      }

      return tx.spu.findUnique({ where: { id }, include: { skus: true } });
    });
  }

  async patchSpuStatus(id: number, status: SpuStatus) {
    return this.prisma.spu.update({ where: { id }, data: { status } });
  }

  listSpusAdmin(page = 1, pageSize = 20) {
    return this.prisma.spu.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { skus: true, category: true },
      orderBy: { id: 'desc' },
    });
  }

  getSpuAdmin(id: number) {
    return this.prisma.spu.findUnique({
      where: { id },
      include: { skus: true, category: true },
    });
  }
}
