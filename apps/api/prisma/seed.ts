import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SpuStatus } from '@simplemall/shared';

const prisma = new PrismaClient();

/** 价格单位：分 */
const categories = [
  { id: 1, name: '服装鞋包', parentId: null as number | null, level: 1, sort: 1, path: '/' },
  { id: 2, name: '男装', parentId: 1, level: 2, sort: 1, path: '/1/' },
  { id: 3, name: '女装', parentId: 1, level: 2, sort: 2, path: '/1/' },
  { id: 4, name: '数码家电', parentId: null, level: 1, sort: 2, path: '/' },
  { id: 5, name: '手机通讯', parentId: 4, level: 2, sort: 1, path: '/4/' },
  { id: 6, name: '电脑办公', parentId: 4, level: 2, sort: 2, path: '/4/' },
  { id: 7, name: '家居生活', parentId: null, level: 1, sort: 3, path: '/' },
  { id: 8, name: '食品饮料', parentId: null, level: 1, sort: 4, path: '/' },
  { id: 9, name: '休闲零食', parentId: 8, level: 2, sort: 1, path: '/8/' },
] as const;

type SkuSeed = {
  id: number;
  specsJson: Record<string, string>;
  price: number;
  stock: number;
};

type SpuSeed = {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  mainImage: string;
  imagesJson: string[];
  skus: SkuSeed[];
};

const spus: SpuSeed[] = [
  {
    id: 1,
    categoryId: 2,
    title: '纯棉圆领短袖 T 恤',
    description: '100% 精梳棉，透气舒适，日常百搭款。',
    mainImage: 'https://picsum.photos/seed/sm1/400/400',
    imagesJson: [
      'https://picsum.photos/seed/sm1/400/400',
      'https://picsum.photos/seed/sm1b/400/400',
    ],
    skus: [
      { id: 1, specsJson: { 颜色: '白色', 尺码: 'M' }, price: 9900, stock: 120 },
      { id: 2, specsJson: { 颜色: '白色', 尺码: 'L' }, price: 9900, stock: 80 },
      { id: 3, specsJson: { 颜色: '黑色', 尺码: 'M' }, price: 9900, stock: 95 },
    ],
  },
  {
    id: 2,
    categoryId: 2,
    title: '修身直筒牛仔裤',
    description: '弹力牛仔面料，修身不紧绷，四季可穿。',
    mainImage: 'https://picsum.photos/seed/sm2/400/400',
    imagesJson: ['https://picsum.photos/seed/sm2/400/400'],
    skus: [
      { id: 4, specsJson: { 颜色: '深蓝', 尺码: '30' }, price: 19900, stock: 60 },
      { id: 5, specsJson: { 颜色: '深蓝', 尺码: '32' }, price: 19900, stock: 55 },
      { id: 6, specsJson: { 颜色: '浅蓝', 尺码: '32' }, price: 20900, stock: 40 },
    ],
  },
  {
    id: 3,
    categoryId: 3,
    title: '碎花雪纺连衣裙',
    description: '轻盈雪纺，收腰显瘦，春夏出游首选。',
    mainImage: 'https://picsum.photos/seed/sm3/400/400',
    imagesJson: [
      'https://picsum.photos/seed/sm3/400/400',
      'https://picsum.photos/seed/sm3b/400/400',
    ],
    skus: [
      { id: 7, specsJson: { 颜色: '杏色', 尺码: 'S' }, price: 15900, stock: 45 },
      { id: 8, specsJson: { 颜色: '杏色', 尺码: 'M' }, price: 15900, stock: 50 },
      { id: 9, specsJson: { 颜色: '浅粉', 尺码: 'M' }, price: 16900, stock: 35 },
    ],
  },
  {
    id: 4,
    categoryId: 3,
    title: '针织开衫外套',
    description: '柔软针织，单穿叠穿皆可，多色可选。',
    mainImage: 'https://picsum.photos/seed/sm4/400/400',
    imagesJson: ['https://picsum.photos/seed/sm4/400/400'],
    skus: [
      { id: 10, specsJson: { 颜色: '米白', 尺码: '均码' }, price: 12900, stock: 70 },
      { id: 11, specsJson: { 颜色: '灰色', 尺码: '均码' }, price: 12900, stock: 65 },
    ],
  },
  {
    id: 5,
    categoryId: 5,
    title: '真无线蓝牙耳机',
    description: '蓝牙 5.3，主动降噪，续航约 30 小时（含充电仓）。',
    mainImage: 'https://picsum.photos/seed/sm5/400/400',
    imagesJson: ['https://picsum.photos/seed/sm5/400/400'],
    skus: [
      { id: 12, specsJson: { 颜色: '白色' }, price: 29900, stock: 88 },
      { id: 13, specsJson: { 颜色: '黑色' }, price: 29900, stock: 92 },
    ],
  },
  {
    id: 6,
    categoryId: 5,
    title: '磁吸手机支架',
    description: '车载/桌面两用，强磁吸附，不伤手机。',
    mainImage: 'https://picsum.photos/seed/sm6/400/400',
    imagesJson: ['https://picsum.photos/seed/sm6/400/400'],
    skus: [{ id: 14, specsJson: { 款式: '标准款' }, price: 3900, stock: 200 }],
  },
  {
    id: 7,
    categoryId: 6,
    title: '机械键盘 87 键',
    description: '热插拔轴体，RGB 背光，适合办公与游戏。',
    mainImage: 'https://picsum.photos/seed/sm7/400/400',
    imagesJson: ['https://picsum.photos/seed/sm7/400/400'],
    skus: [
      { id: 15, specsJson: { 轴体: '红轴', 配色: '黑色' }, price: 45900, stock: 30 },
      { id: 16, specsJson: { 轴体: '青轴', 配色: '白色' }, price: 46900, stock: 25 },
    ],
  },
  {
    id: 8,
    categoryId: 6,
    title: '无线静音鼠标',
    description: '2.4G 连接，人体工学设计，办公静音按键。',
    mainImage: 'https://picsum.photos/seed/sm8/400/400',
    imagesJson: ['https://picsum.photos/seed/sm8/400/400'],
    skus: [
      { id: 17, specsJson: { 颜色: '黑色' }, price: 6900, stock: 150 },
      { id: 18, specsJson: { 颜色: '粉色' }, price: 6900, stock: 80 },
    ],
  },
  {
    id: 9,
    categoryId: 7,
    title: '北欧简约台灯',
    description: '三档调光，护眼柔光，适合书桌与床头。',
    mainImage: 'https://picsum.photos/seed/sm9/400/400',
    imagesJson: ['https://picsum.photos/seed/sm9/400/400'],
    skus: [
      { id: 19, specsJson: { 颜色: '白色' }, price: 8900, stock: 75 },
      { id: 20, specsJson: { 颜色: '原木色' }, price: 9900, stock: 60 },
    ],
  },
  {
    id: 10,
    categoryId: 7,
    title: '记忆棉午睡枕',
    description: '慢回弹记忆棉，可拆洗外套，办公室午休神器。',
    mainImage: 'https://picsum.photos/seed/sm10/400/400',
    imagesJson: ['https://picsum.photos/seed/sm10/400/400'],
    skus: [{ id: 21, specsJson: { 规格: '标准款' }, price: 5900, stock: 110 }],
  },
  {
    id: 11,
    categoryId: 9,
    title: '每日坚果礼盒',
    description: '7 种坚果果干搭配，独立小包装，每日一包。',
    mainImage: 'https://picsum.photos/seed/sm11/400/400',
    imagesJson: ['https://picsum.photos/seed/sm11/400/400'],
    skus: [
      { id: 22, specsJson: { 规格: '750g/30 袋' }, price: 12800, stock: 90 },
      { id: 23, specsJson: { 规格: '1.2kg/48 袋' }, price: 19800, stock: 50 },
    ],
  },
  {
    id: 12,
    categoryId: 8,
    title: '进口全脂牛奶 12 盒装',
    description: '1L×12 盒，高蛋白，早餐与烘焙适用。',
    mainImage: 'https://picsum.photos/seed/sm12/400/400',
    imagesJson: ['https://picsum.photos/seed/sm12/400/400'],
    skus: [{ id: 24, specsJson: { 规格: '12 盒/箱' }, price: 8990, stock: 120 }],
  },
];

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminHash,
      role: 'SUPER',
    },
  });

  const userHash = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      password: userHash,
      nickname: '演示用户',
    },
  });

  await prisma.spu.updateMany({ where: { status: 'DRAFT' }, data: { status: SpuStatus.NOT_LISTED } });

  const brands = [
    { id: 1, name: '简约造物' },
    { id: 2, name: '数码优选' },
  ];
  for (const b of brands) {
    await prisma.brand.upsert({
      where: { id: b.id },
      update: { name: b.name },
      create: b,
    });
  }

  const expressTemplates = [
    { id: 1, name: '全国包邮', firstFee: 0, continueFee: 0, remark: '全场包邮' },
    { id: 2, name: '标准快递', firstFee: 800, continueFee: 300, remark: '首件8元，续件3元' },
    { id: 3, name: '重货物流', firstFee: 1500, continueFee: 800, remark: '大件/重货' },
  ];
  for (const t of expressTemplates) {
    await prisma.expressTemplate.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  for (const tagName of ['新品', '爆款', '热销', '限时', '包邮']) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }

  const catMeta = (categoryId: number) => {
    const leaf = categories.find((c) => c.id === categoryId);
    if (!leaf?.parentId) {
      return { cate1Id: categoryId, cate2Id: 0, cate3Id: categoryId, categoryPath: `${categoryId}` };
    }
    return {
      cate1Id: leaf.parentId,
      cate2Id: categoryId,
      cate3Id: categoryId,
      categoryPath: `${leaf.parentId},${categoryId}`,
    };
  };

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        parentId: c.parentId,
        level: c.level,
        sort: c.sort,
        path: c.path,
      },
      create: {
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        level: c.level,
        sort: c.sort,
        path: c.path,
      },
    });
  }

  for (const s of spus) {
    const meta = catMeta(s.categoryId);
    const totalStock = s.skus.reduce((n, k) => n + k.stock, 0);
    const minPrice = Math.min(...s.skus.map((k) => k.price));
    const specType = s.skus.length > 1 || Object.keys(s.skus[0].specsJson).length > 0 ? 1 : 0;
    const extras = {
      goodsSn: `SM${String(s.id).padStart(6, '0')}`,
      shortName: s.title.slice(0, 20),
      subtitle: s.description.slice(0, 80),
      brandId: s.categoryId <= 3 ? 1 : s.categoryId <= 6 ? 2 : null,
      ...meta,
      specType,
      tagList: s.id <= 3 ? '新品,爆款' : s.id <= 6 ? '热销' : '',
      marketPrice: Math.round(minPrice * 1.2),
      costPrice: Math.round(minPrice * 0.6),
      vipPrice: Math.round(minPrice * 0.95),
      totalStock,
      warnStock: 10,
      isNew: s.id <= 2,
      isHot: s.id >= 5 && s.id <= 8,
      isRecommend: s.id <= 4,
      sort: 100 - s.id,
      putawayTime: new Date(),
    };
    await prisma.spu.upsert({
      where: { id: s.id },
      update: {
        categoryId: s.categoryId,
        title: s.title,
        description: s.description,
        mainImage: s.mainImage,
        imagesJson: s.imagesJson,
        status: SpuStatus.ON_SALE,
        ...extras,
      },
      create: {
        id: s.id,
        categoryId: s.categoryId,
        title: s.title,
        description: s.description,
        mainImage: s.mainImage,
        imagesJson: s.imagesJson,
        status: SpuStatus.ON_SALE,
        ...extras,
      },
    });

    for (const sku of s.skus) {
      await prisma.sku.upsert({
        where: { id: sku.id },
        update: {
          spuId: s.id,
          specsJson: sku.specsJson,
          price: sku.price,
          stock: sku.stock,
          status: 'ENABLED',
        },
        create: {
          id: sku.id,
          spuId: s.id,
          specsJson: sku.specsJson,
          price: sku.price,
          stock: sku.stock,
          status: 'ENABLED',
        },
      });
    }
  }

  await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      userId: user.id,
      name: '张三',
      phone: '13800138000',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      detail: '世纪大道 1 号',
      isDefault: true,
    },
  });

  console.log(
    `Seed OK: ${categories.length} 个类目, ${spus.length} 个 SPU, ${spus.reduce((n, s) => n + s.skus.length, 0)} 个 SKU`,
  );
  console.log('账号: admin/admin123, 用户 13800138000/user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
