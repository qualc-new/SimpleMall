import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { SpuStatus } from '@simplemall/shared';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCategoryTree() {
    const list = await this.prisma.category.findMany({ orderBy: { sort: 'asc' } });
    return this.buildTree(list, null);
  }

  private buildTree(
    list: { id: number; parentId: number | null; name: string; level: number; sort: number }[],
    parentId: number | null,
  ) {
    return list
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        level: c.level,
        sort: c.sort,
        children: this.buildTree(list, c.id),
      }));
  }

  async listSpus(query: {
    categoryId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SpuWhereInput = { status: SpuStatus.ON_SALE };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.keyword) where.title = { contains: query.keyword };

    const [list, total] = await Promise.all([
      this.prisma.spu.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { skus: { where: { status: 'ENABLED' } } },
        orderBy: { id: 'desc' },
      }),
      this.prisma.spu.count({ where }),
    ]);

    return {
      list: list.map((s) => ({
        id: s.id,
        title: s.title,
        mainImage: s.mainImage,
        categoryId: s.categoryId,
        status: s.status,
        minPrice: Math.min(...s.skus.map((k) => k.price), 0) || 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getSpuDetail(id: number) {
    const spu = await this.prisma.spu.findUnique({
      where: { id },
      include: { skus: true },
    });
    if (!spu || spu.status !== SpuStatus.ON_SALE) {
      throw BizError.notFound('商品不存在或已下架');
    }
    const images = Array.isArray(spu.imagesJson) ? spu.imagesJson : [];
    return {
      id: spu.id,
      title: spu.title,
      description: spu.description,
      mainImage: spu.mainImage,
      images,
      categoryId: spu.categoryId,
      status: spu.status,
      skus: spu.skus.map((k) => ({
        id: k.id,
        spuId: k.spuId,
        specs: k.specsJson as Record<string, string>,
        price: k.price,
        stock: k.stock,
        status: k.status,
      })),
    };
  }
}
