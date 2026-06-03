# SimpleMall

轻量电商 Monorepo，架构与开发说明见 [docs/README.md](./docs/README.md)。

## 技术栈

| 应用 | 路径 | 端口 |
|------|------|------|
| API | `apps/api` | 4000 |
| Web 商城 | `apps/web` | 3000 |
| 管理后台 | `apps/admin` | 5173 |

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 MySQL + Redis
pnpm db:up

# 3. 配置并迁移数据库
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm db:seed

# 4. 启动三端（或分别启动）
pnpm dev
```

### 默认账号（seed）

| 端 | 账号 | 密码 |
|----|------|------|
| 管理后台 | `admin` | `admin123` |
| C 端演示 | `13800138000` | `user123` |

## 常用命令

```bash
pnpm dev:api      # 仅 API
pnpm dev:web      # 仅商城
pnpm dev:admin    # 仅后台
pnpm build        # 构建全部
```

API 健康检查：`GET http://localhost:4000/api/v1/health`

## 已实现功能

### C 端商城
- 注册 / 登录、商品列表与详情（SKU 规格）、分类浏览
- 购物车（勾选、改数量）、结算、模拟支付
- 收货地址 CRUD、订单列表 / 详情（支付、取消、确认收货、申请退货）

### 管理后台
- 类目 CRUD、SPU 发布（规格矩阵生成 SKU）、上下架
- 订单列表 / 详情、发货、退货审核、SKU 调库存
- 模拟支付回调工具（SUPER）

### API
- JWT 鉴权（用户 / 管理员分离）、库存两阶段扣减与防超卖
- 订单状态机、支付模拟回调、超时关单与自动确认收货定时任务
