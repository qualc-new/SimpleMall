import { Injectable } from '@nestjs/common';
import { SpuStatus, TagStatus, syncSpuStatusByStock, totalAvailableStock } from '@simplemall/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { syncSpuStatusAfterStockChange } from './spu-status.helper';
import { BizError } from '../../../common/exceptions/business.exception';
import { assertSpuServiceListEnabled } from './service-list.helper';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin-category.dto';
import { AdminCreateSpuDto, AdminUpdateSpuDto } from './dto/admin-spu.dto';
import {
  buildSpuCreateData,
  buildSpuUpdateData,
  formatSpuExtra,
  resolveCategoryMeta,
} from './spu-meta.helper';

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

  listBrands() {
    return this.prisma.brand.findMany({ orderBy: { id: 'asc' } });
  }

  createBrand(name: string) {
    return this.prisma.brand.create({ data: { name } });
  }

  async updateBrand(id: number, name: string) {
    const row = await this.prisma.brand.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    return this.prisma.brand.update({ where: { id }, data: { name } });
  }

  async deleteBrand(id: number) {
    const used = await this.prisma.spu.count({ where: { brandId: id } });
    if (used > 0) throw BizError.notFound('品牌下存在商品，无法删除');
    await this.prisma.brand.delete({ where: { id } });
    return { ok: true };
  }

  listExpressTemplates() {
    return this.prisma.expressTemplate.findMany({ orderBy: { id: 'asc' } });
  }

  createExpressTemplate(data: {
    name: string;
    firstFee?: number;
    continueFee?: number;
    remark?: string;
  }) {
    return this.prisma.expressTemplate.create({
      data: {
        name: data.name,
        firstFee: data.firstFee ?? 0,
        continueFee: data.continueFee ?? 0,
        remark: data.remark ?? '',
      },
    });
  }

  async updateExpressTemplate(
    id: number,
    data: { name?: string; firstFee?: number; continueFee?: number; remark?: string },
  ) {
    const row = await this.prisma.expressTemplate.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    return this.prisma.expressTemplate.update({ where: { id }, data });
  }

  async deleteExpressTemplate(id: number) {
    const used = await this.prisma.spu.count({ where: { expressId: id } });
    if (used > 0) throw BizError.notFound('模板已被商品引用，无法删除');
    await this.prisma.expressTemplate.delete({ where: { id } });
    return { ok: true };
  }

  listTagsAdmin() {
    return this.prisma.tag.findMany({
      orderBy: [{ isHot: 'desc' }, { id: 'asc' }],
    });
  }

  /** 商品表单：仅返回启用中的标签 */
  searchTagsForSpu(keyword?: string, limit = 30) {
    const q = keyword?.trim();
    return this.prisma.tag.findMany({
      where: {
        status: TagStatus.ENABLED,
        ...(q ? { name: { contains: q } } : {}),
      },
      take: limit,
      orderBy: [{ isHot: 'desc' }, { name: 'asc' }],
    });
  }

  createTag(data: { name: string; status?: TagStatus; isHot?: boolean }) {
    const name = data.name.trim();
    if (!name) throw BizError.notFound('标签名不能为空');
    return this.prisma.tag.create({
      data: {
        name,
        status: data.status ?? TagStatus.ENABLED,
        isHot: data.isHot ?? false,
      },
    });
  }

  async updateTag(id: number, data: { name?: string; status?: TagStatus; isHot?: boolean }) {
    const row = await this.prisma.tag.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    if (data.name && data.name !== row.name) {
      const dup = await this.prisma.tag.findFirst({ where: { name: data.name, id: { not: id } } });
      if (dup) throw BizError.notFound('标签名称已存在');
    }
    return this.prisma.tag.update({ where: { id }, data });
  }

  listServiceGuaranteesAdmin() {
    return this.prisma.serviceGuarantee.findMany({
      orderBy: [{ sort: 'desc' }, { id: 'asc' }],
    });
  }

  searchServiceGuaranteesForSpu(keyword?: string, limit = 30) {
    const q = keyword?.trim();
    return this.prisma.serviceGuarantee.findMany({
      where: {
        status: TagStatus.ENABLED,
        ...(q ? { name: { contains: q } } : {}),
      },
      take: limit,
      orderBy: [{ sort: 'desc' }, { name: 'asc' }],
    });
  }

  createServiceGuarantee(data: { name: string; status?: TagStatus; sort?: number }) {
    const name = data.name.trim();
    if (!name) throw BizError.notFound('名称不能为空');
    return this.prisma.serviceGuarantee.create({
      data: {
        name,
        status: data.status ?? TagStatus.ENABLED,
        sort: data.sort ?? 0,
      },
    });
  }

  async updateServiceGuarantee(
    id: number,
    data: { name?: string; status?: TagStatus; sort?: number },
  ) {
    const row = await this.prisma.serviceGuarantee.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    if (data.name && data.name !== row.name) {
      const dup = await this.prisma.serviceGuarantee.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (dup) throw BizError.notFound('名称已存在');
    }
    return this.prisma.serviceGuarantee.update({ where: { id }, data });
  }

  async deleteServiceGuarantee(id: number) {
    const row = await this.prisma.serviceGuarantee.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    const used = await this.prisma.spu.count({
      where: {
        OR: [
          { serviceList: row.name },
          { serviceList: { startsWith: `${row.name},` } },
          { serviceList: { endsWith: `,${row.name}` } },
          { serviceList: { contains: `,${row.name},` } },
        ],
      },
    });
    if (used > 0) throw BizError.notFound('已被商品使用，无法删除');
    await this.prisma.serviceGuarantee.delete({ where: { id } });
    return { ok: true };
  }

  async assertSpuServicesEnabled(serviceList?: string) {
    try {
      await assertSpuServiceListEnabled(this.prisma, serviceList);
    } catch (e) {
      throw BizError.notFound(e instanceof Error ? e.message : '服务保障校验失败');
    }
  }

  async deleteTag(id: number) {
    const row = await this.prisma.tag.findUnique({ where: { id } });
    if (!row) throw BizError.notFound();
    const used = await this.prisma.spu.count({
      where: {
        OR: [
          { tagList: row.name },
          { tagList: { startsWith: `${row.name},` } },
          { tagList: { endsWith: `,${row.name}` } },
          { tagList: { contains: `,${row.name},` } },
        ],
      },
    });
    if (used > 0) throw BizError.notFound('标签已被商品使用，无法删除');
    await this.prisma.tag.delete({ where: { id } });
    return { ok: true };
  }

  /** 保存商品时校验 tag_list 均为启用标签 */
  async assertSpuTagsEnabled(tagList?: string) {
    if (!tagList?.trim()) return;
    const names = tagList
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!names.length) return;
    const rows = await this.prisma.tag.findMany({
      where: { name: { in: names }, status: TagStatus.ENABLED },
    });
    const ok = new Set(rows.map((t) => t.name));
    const bad = names.filter((n) => !ok.has(n));
    if (bad.length) throw BizError.notFound(`请先在标签管理启用或创建：${bad.join('、')}`);
  }

  async createSpu(dto: AdminCreateSpuDto) {
    await this.assertSpuTagsEnabled(dto.tagList);
    await this.assertSpuServicesEnabled(dto.serviceList);
    const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!cat) throw BizError.notFound('类目不存在');
    if (!dto.skus?.length) throw BizError.notFound('至少一个 SKU');
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) throw BizError.notFound('品牌不存在');
    }

    return this.prisma.$transaction(async (tx) => {
      const data = await buildSpuCreateData(this.prisma, dto);
      const spu = await tx.spu.create({ data });
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
      await syncSpuStatusAfterStockChange(this.prisma, spu.id);
      return this.getSpuAdmin(spu.id);
    });
  }

  async updateSpu(id: number, dto: AdminUpdateSpuDto) {
    if (dto.tagList != null) await this.assertSpuTagsEnabled(dto.tagList);
    if (dto.serviceList != null) await this.assertSpuServicesEnabled(dto.serviceList);
    const spu = await this.prisma.spu.findUnique({ where: { id }, include: { skus: true } });
    if (!spu) throw BizError.notFound();
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) throw BizError.notFound('品牌不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      const catMeta =
        dto.categoryId != null ? await resolveCategoryMeta(this.prisma, dto.categoryId) : undefined;
      const updateData = buildSpuUpdateData(dto, catMeta, dto.skus);
      if (Object.keys(updateData).length > 0) {
        await tx.spu.update({ where: { id }, data: updateData });
      }

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
    });

    await syncSpuStatusAfterStockChange(this.prisma, id);
    return this.getSpuAdmin(id);
  }

  async patchSpuStatus(id: number, status: SpuStatus) {
    const spu = await this.prisma.spu.findUnique({ where: { id }, include: { skus: true } });
    if (!spu) throw BizError.notFound();
    let next = status;
    if (status === SpuStatus.ON_SALE) {
      next = syncSpuStatusByStock(SpuStatus.ON_SALE, totalAvailableStock(spu.skus));
    }
    const putawayTime = next === SpuStatus.ON_SALE && !spu.putawayTime ? new Date() : spu.putawayTime;
    return this.prisma.spu.update({
      where: { id },
      data: { status: next, putawayTime },
      include: { skus: true, category: true, brand: true },
    });
  }

  async syncSpuStatusByStock(spuId: number) {
    return syncSpuStatusAfterStockChange(this.prisma, spuId);
  }

  /** 管理端商品分页列表（支持状态/类目/品牌/关键词筛选） */
  async listSpusAdmin(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    categoryId?: number;
    brandId?: number;
    keyword?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const where: {
      status?: string;
      categoryId?: number;
      brandId?: number;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;

    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { subtitle: { contains: keyword } },
        { shortName: { contains: keyword } },
        { goodsSn: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.spu.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          skus: { orderBy: { id: 'asc' } },
          category: true,
          brand: true,
        },
        orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.spu.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async getSpuAdmin(id: number) {
    const spu = await this.prisma.spu.findUnique({
      where: { id },
      include: { skus: true, category: true, brand: true },
    });
    if (!spu) return null;
    const images = Array.isArray(spu.imagesJson) ? spu.imagesJson : [];
    return {
      ...spu,
      images,
      ...formatSpuExtra(spu),
      brandName: spu.brand?.name,
    };
  }
}
