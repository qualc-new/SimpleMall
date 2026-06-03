import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BizError } from '../../common/exceptions/business.exception';
import { isSpuStorefrontVisible, normalizeSpuStatus, TagStatus } from '@simplemall/shared';
import { SPU_STOREFRONT_WHERE } from './spu-status.helper';
import { formatSpuExtra } from './spu-meta.helper';
import { resolveEnabledServiceGuarantees } from './service-list.helper';

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

  private mapSpuCard(
    s: {
      id: number;
      title: string;
      shortName: string;
      subtitle: string;
      mainImage: string;
      categoryId: number;
      status: string;
      marketPrice: number;
      totalStock: number;
      saleNum: number;
      tagList: string;
      isNew: boolean;
      isHot: boolean;
      isRecommend: boolean;
      skus: { price: number }[];
    },
  ) {
    return {
      id: s.id,
      title: s.title,
      shortName: s.shortName,
      subtitle: s.subtitle,
      mainImage: s.mainImage,
      categoryId: s.categoryId,
      status: normalizeSpuStatus(s.status),
      minPrice: Math.min(...s.skus.map((k) => k.price), 0) || 0,
      marketPrice: s.marketPrice,
      totalStock: s.totalStock,
      saleNum: s.saleNum,
      tagList: s.tagList ? s.tagList.split(',').filter(Boolean) : [],
      isNew: s.isNew,
      isHot: s.isHot,
      isRecommend: s.isRecommend,
    };
  }

  private applyTagFilter(where: Prisma.SpuWhereInput, tagName: string) {
    const t = tagName.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { tagList: t },
          { tagList: { startsWith: `${t},` } },
          { tagList: { endsWith: `,${t}` } },
          { tagList: { contains: `,${t},` } },
        ],
      },
    ];
  }

  async listSpus(query: {
    categoryId?: number;
    keyword?: string;
    tag?: string;
    /** 统一搜索词：命中启用标签名则按标签筛，否则按关键词搜 */
    q?: string;
    recommend?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SpuWhereInput = { ...SPU_STOREFRONT_WHERE };
    if (query.categoryId) where.categoryId = query.categoryId;

    const q = query.q?.trim();
    if (q) {
      const enabledTag = await this.prisma.tag.findFirst({
        where: { name: q, status: TagStatus.ENABLED },
      });
      if (enabledTag) {
        this.applyTagFilter(where, q);
      } else {
        where.OR = [
          { title: { contains: q } },
          { subtitle: { contains: q } },
          { shortName: { contains: q } },
        ];
      }
    } else {
      if (query.keyword) {
        where.OR = [
          { title: { contains: query.keyword } },
          { subtitle: { contains: query.keyword } },
          { shortName: { contains: query.keyword } },
        ];
      }
      if (query.tag) {
        this.applyTagFilter(where, query.tag);
      }
    }
    if (query.recommend) where.isRecommend = true;

    const orderBy: Prisma.SpuOrderByWithRelationInput[] = query.recommend
      ? [{ sort: 'desc' }, { saleNum: 'desc' }, { id: 'desc' }]
      : [{ sort: 'desc' }, { saleNum: 'desc' }, { id: 'desc' }];

    const [list, total] = await Promise.all([
      this.prisma.spu.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { skus: { where: { status: 'ENABLED' } } },
        orderBy,
      }),
      this.prisma.spu.count({ where }),
    ]);

    return {
      list: list.map((s) => this.mapSpuCard(s)),
      total,
      page,
      pageSize,
    };
  }

  listEnabledTags() {
    return this.prisma.tag.findMany({
      where: { status: TagStatus.ENABLED },
      orderBy: [{ isHot: 'desc' }, { name: 'asc' }],
    });
  }

  listHotTags() {
    return this.prisma.tag.findMany({
      where: { status: TagStatus.ENABLED, isHot: true },
      orderBy: { name: 'asc' },
    });
  }

  /** 商城首页聚合数据 */
  async getHome() {
    const [hotTags, filterTags, categories, recommend] = await Promise.all([
      this.listHotTags(),
      this.listEnabledTags(),
      this.prisma.category.findMany({
        where: { level: 1 },
        orderBy: { sort: 'desc' },
      }),
      this.listSpus({ recommend: true, pageSize: 8 }),
    ]);

    const activities = hotTags.slice(0, 4).map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: '精选好物',
      image: null as string | null,
      link: `/search?q=${encodeURIComponent(t.name)}`,
    }));

    if (activities.length < 3) {
      const fallback = await this.prisma.spu.findMany({
        where: { ...SPU_STOREFRONT_WHERE, isHot: true },
        take: 3,
        orderBy: { sort: 'desc' },
      });
      for (const s of fallback) {
        if (activities.length >= 4) break;
        activities.push({
          id: 10000 + s.id,
          title: s.shortName || s.title,
          subtitle: s.subtitle || '热销推荐',
          image: s.mainImage,
          link: `/products/${s.id}`,
        });
      }
    }

    return {
      hotTags,
      filterTags: filterTags.map((t) => ({ id: t.id, name: t.name, isHot: t.isHot })),
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      activities,
      recommend: recommend.list,
    };
  }

  async getSpuDetail(id: number) {
    const spu = await this.prisma.spu.findUnique({
      where: { id },
      include: { skus: true },
    });
    if (!spu || !isSpuStorefrontVisible(spu.status)) {
      throw BizError.notFound('商品不存在或已下架');
    }
    const images = Array.isArray(spu.imagesJson) ? spu.imagesJson : [];
    const serviceGuarantees = await resolveEnabledServiceGuarantees(this.prisma, spu.serviceList);
    let express: { id: number; name: string; firstFee: number; continueFee: number; remark: string } | null =
      null;
    if (spu.expressId > 0) {
      const row = await this.prisma.expressTemplate.findUnique({ where: { id: spu.expressId } });
      if (row) {
        express = {
          id: row.id,
          name: row.name,
          firstFee: row.firstFee,
          continueFee: row.continueFee,
          remark: row.remark,
        };
      }
    }
    return {
      id: spu.id,
      title: spu.title,
      description: spu.description,
      mainImage: spu.mainImage,
      images,
      categoryId: spu.categoryId,
      status: normalizeSpuStatus(spu.status),
      expressId: spu.expressId,
      shipFrom: '上海',
      express,
      serviceGuarantees,
      ...formatSpuExtra(spu),
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
