import type { Prisma } from '@prisma/client';
import { SpuStatus } from '@simplemall/shared';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { AdminCreateSpuDto, AdminUpdateSpuDto } from './dto/admin-spu.dto';

type SkuInput = { specs: Record<string, string>; price: number; stock: number };

/** 解析类目链 → cate1/2/3 与 category_path（兼容二/三级类目） */
export async function resolveCategoryMeta(prisma: PrismaService, categoryId: number) {
  const chain: number[] = [];
  let cur = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cur) throw new Error('类目不存在');
  while (cur) {
    chain.unshift(cur.id);
    if (!cur.parentId) break;
    cur = await prisma.category.findUnique({ where: { id: cur.parentId } });
  }
  const cate1Id = chain[0] ?? categoryId;
  const cate2Id = chain[1] ?? 0;
  const cate3Id = chain[2] ?? chain[chain.length - 1] ?? categoryId;
  return {
    cate1Id,
    cate2Id,
    cate3Id,
    categoryPath: chain.join(','),
  };
}

export function inferSpecType(skus: SkuInput[]): number {
  if (skus.length <= 1) {
    const specs = skus[0]?.specs ?? {};
    return Object.keys(specs).length === 0 ? 0 : 1;
  }
  return 1;
}

export function sumSkuStock(skus: Array<{ stock: number; status?: string }>): number {
  return skus.filter((s) => s.status !== 'DISABLED').reduce((n, s) => n + s.stock, 0);
}

export function minSkuPrice(skus: SkuInput[]): number {
  if (!skus.length) return 0;
  return Math.min(...skus.map((s) => s.price));
}

function parseAttrJson(raw: unknown): Prisma.InputJsonValue | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Prisma.InputJsonValue;
    } catch {
      return undefined;
    }
  }
  return raw as Prisma.InputJsonValue;
}

function normalizeCommaList(raw?: string): string {
  if (!raw) return '';
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .join(',');
}

function normalizeTags(tagList?: string): string {
  return normalizeCommaList(tagList);
}

export async function buildSpuCreateData(
  prisma: PrismaService,
  dto: AdminCreateSpuDto,
): Promise<Prisma.SpuCreateInput> {
  const catMeta = await resolveCategoryMeta(prisma, dto.categoryId);
  const specType = inferSpecType(dto.skus);
  const totalStock = sumSkuStock(dto.skus.map((s) => ({ stock: s.stock, status: 'ENABLED' })));
  const putawayTime =
    dto.status === SpuStatus.ON_SALE ? (dto.putawayTime ? new Date(dto.putawayTime) : new Date()) : null;

  return {
    goodsSn: dto.goodsSn || `SM${Date.now()}`,
    title: dto.title,
    shortName: dto.shortName ?? '',
    subtitle: dto.subtitle ?? '',
    description: dto.description,
    category: { connect: { id: dto.categoryId } },
    ...catMeta,
    mainImage: dto.mainImage,
    imagesJson: dto.images ?? [],
    specType,
    attrJson: parseAttrJson(dto.attrJson),
    tagList: normalizeTags(dto.tagList),
    serviceList: normalizeCommaList(dto.serviceList),
    marketPrice: dto.marketPrice ?? minSkuPrice(dto.skus),
    costPrice: dto.costPrice ?? 0,
    vipPrice: dto.vipPrice ?? 0,
    unit: dto.unit ?? '件',
    weight: dto.weight ?? 0,
    volume: dto.volume ?? 0,
    totalStock,
    warnStock: dto.warnStock ?? 10,
    expressId: dto.expressId ?? 0,
    freightType: dto.freightType ?? 0,
    limitBuy: dto.limitBuy ?? 0,
    isNew: dto.isNew ?? false,
    isHot: dto.isHot ?? false,
    isRecommend: dto.isRecommend ?? false,
    status: dto.status,
    sort: dto.sort ?? 0,
    putawayTime,
    ...(dto.brandId ? { brand: { connect: { id: dto.brandId } } } : {}),
  };
}

export function buildSpuUpdateData(
  dto: AdminUpdateSpuDto,
  catMeta?: Awaited<ReturnType<typeof resolveCategoryMeta>>,
  skus?: SkuInput[],
): Prisma.SpuUpdateInput {
  const data: Prisma.SpuUpdateInput = {};
  if (dto.goodsSn !== undefined) data.goodsSn = dto.goodsSn || null;
  if (dto.title != null) data.title = dto.title;
  if (dto.shortName != null) data.shortName = dto.shortName;
  if (dto.subtitle != null) data.subtitle = dto.subtitle;
  if (dto.description != null) data.description = dto.description;
  if (dto.categoryId != null) {
    data.category = { connect: { id: dto.categoryId } };
    if (catMeta) Object.assign(data, catMeta);
  }
  if (dto.mainImage != null) data.mainImage = dto.mainImage;
  if (dto.images != null) data.imagesJson = dto.images;
  if (dto.attrJson !== undefined) data.attrJson = parseAttrJson(dto.attrJson);
  if (dto.tagList != null) data.tagList = normalizeTags(dto.tagList);
  if (dto.serviceList != null) data.serviceList = normalizeCommaList(dto.serviceList);
  if (dto.marketPrice != null) data.marketPrice = dto.marketPrice;
  if (dto.costPrice != null) data.costPrice = dto.costPrice;
  if (dto.vipPrice != null) data.vipPrice = dto.vipPrice;
  if (dto.unit != null) data.unit = dto.unit;
  if (dto.weight != null) data.weight = dto.weight;
  if (dto.volume != null) data.volume = dto.volume;
  if (dto.warnStock != null) data.warnStock = dto.warnStock;
  if (dto.expressId != null) data.expressId = dto.expressId;
  if (dto.freightType != null) data.freightType = dto.freightType;
  if (dto.limitBuy != null) data.limitBuy = dto.limitBuy;
  if (dto.isNew != null) data.isNew = dto.isNew;
  if (dto.isHot != null) data.isHot = dto.isHot;
  if (dto.isRecommend != null) data.isRecommend = dto.isRecommend;
  if (dto.status != null) {
    data.status = dto.status;
    if (dto.status === SpuStatus.ON_SALE && dto.putawayTime) {
      data.putawayTime = new Date(dto.putawayTime);
    }
  }
  if (dto.sort != null) data.sort = dto.sort;
  if (dto.brandId !== undefined) {
    data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
  }
  if (skus) {
    data.specType = inferSpecType(skus);
    data.totalStock = sumSkuStock(skus.map((s) => ({ stock: s.stock, status: 'ENABLED' })));
  }
  return data;
}

/** C 端 / 管理端通用 SPU 扩展字段序列化 */
export function formatSpuExtra(spu: {
  goodsSn: string | null;
  shortName: string;
  subtitle: string;
  brandId: number | null;
  cate1Id: number;
  cate2Id: number;
  cate3Id: number;
  categoryPath: string;
  specType: number;
  attrJson: unknown;
  tagList: string;
  serviceList: string;
  marketPrice: number;
  costPrice: number;
  vipPrice: number;
  unit: string;
  weight: number;
  volume: number;
  totalStock: number;
  saleNum: number;
  warnStock: number;
  freightType: number;
  limitBuy: number;
  isNew: boolean;
  isHot: boolean;
  isRecommend: boolean;
  sort: number;
  putawayTime: Date | null;
}) {
  return {
    goodsSn: spu.goodsSn,
    shortName: spu.shortName,
    subtitle: spu.subtitle,
    brandId: spu.brandId,
    cate1Id: spu.cate1Id,
    cate2Id: spu.cate2Id,
    cate3Id: spu.cate3Id,
    categoryPath: spu.categoryPath,
    specType: spu.specType,
    attrJson: spu.attrJson,
    tagList: spu.tagList ? spu.tagList.split(',').filter(Boolean) : [],
    serviceList: spu.serviceList ? spu.serviceList.split(',').filter(Boolean) : [],
    marketPrice: spu.marketPrice,
    costPrice: spu.costPrice,
    vipPrice: spu.vipPrice,
    unit: spu.unit,
    weight: spu.weight,
    volume: spu.volume,
    totalStock: spu.totalStock,
    saleNum: spu.saleNum,
    warnStock: spu.warnStock,
    freightType: spu.freightType,
    limitBuy: spu.limitBuy,
    isNew: spu.isNew,
    isHot: spu.isHot,
    isRecommend: spu.isRecommend,
    sort: spu.sort,
    putawayTime: spu.putawayTime,
  };
}
