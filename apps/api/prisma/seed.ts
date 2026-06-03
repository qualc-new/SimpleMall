import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  const cat = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '默认分类',
      level: 1,
      sort: 0,
      path: '/1/',
    },
  });

  const spu = await prisma.spu.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      categoryId: cat.id,
      title: '演示商品 T 恤',
      description: 'SimpleMall 演示商品',
      mainImage: 'https://picsum.photos/400/400',
      imagesJson: ['https://picsum.photos/400/400'],
      status: 'ON_SALE',
    },
  });

  await prisma.sku.upsert({
    where: { id: 1 },
    update: { stock: 100 },
    create: {
      id: 1,
      spuId: spu.id,
      specsJson: { 颜色: '白色', 尺码: 'M' },
      price: 9900,
      stock: 100,
      status: 'ENABLED',
    },
  });

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

  console.log('Seed OK: admin/admin123, user 13800138000/user123');
}

main()
  .finally(() => prisma.$disconnect());
