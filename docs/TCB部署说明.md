# 腾讯云开发（TCB）部署说明 — Prisma 模式

> 业务数据库采用官方推荐的 **ORM → Prisma + 云开发 MySQL**，沿用现有 `PrismaService`，**不**使用 `@cloudbase/node-sdk` 的 `rdb()` API。

---

## 1. 架构

```
┌──────────────── CloudBase 环境 ────────────────┐
│  静态托管: Web (/) + Admin (/admin)             │
│  云托管: NestJS API (Prisma → MySQL)            │
│  云开发 MySQL ← DATABASE_URL                    │
│  Redis ← REDIS_URL                              │
└────────────────────────────────────────────────┘
```

| 能力 | 实现 |
|------|------|
| 订单/商品/用户等 CRUD | **Prisma** + `DATABASE_URL` |
| 迁移 | `prisma migrate deploy` |
| API 运行时 | 云托管容器 `deploy/tcb/Dockerfile` |

---

## 2. 云开发 MySQL（Prisma 接入）

1. 控制台 → **数据库** → **MySQL** → 创建库（如 `simplemall`）
2. 接入指引 → **ORMs** → **Prisma** → 复制 **内网** 连接串
3. 填入云托管环境变量：

```env
DATABASE_URL=mysql://root:密码@内网地址:3306/simplemall
```

4. 本地/CI 执行迁移（仅需首次或发版时）：

```bash
cd apps/api
DATABASE_URL="上述连接串" pnpm exec prisma migrate deploy
pnpm exec prisma generate   # 构建镜像时已执行，迁移后建议再 generate
# 可选演示数据
pnpm prisma:seed
```

`apps/api/prisma/schema.prisma` 已配置 `provider = "mysql"`，无需改模型。

---

## 3. 环境变量

见 [`deploy/tcb/env.example`](../deploy/tcb/env.example)。

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | **Prisma 连接云开发 MySQL（核心）** |
| `REDIS_URL` | 会话/锁/库存缓存 |
| `PUBLIC_API_BASE` | 对外 API 根 URL，上传图绝对路径 |
| `CORS_ORIGINS` | Web、Admin 静态站域名 |
| `CLOUDBASE_ENV_ID` | 写在根目录 `.env`，供 `cloudbaserc.json` 部署 |

---

## 4. 部署 API（云托管）

```bash
# 根目录
cp .env.tcb.example .env
# 编辑 CLOUDBASE_ENV_ID

tcb login
tcb framework deploy
# 或仅构建镜像：pnpm run build:tcb:api
```

健康检查：`GET /api/v1/health`

---

## 5. 部署 Web / Admin（静态托管）

```bash
export NUXT_PUBLIC_API_BASE=https://你的API/api/v1
export VITE_API_BASE=https://你的API/api/v1
export VITE_API_V2_BASE=https://你的API/api/v2

pnpm run build:tcb:static
# 上传 apps/web/.output/public、apps/admin/dist
```

Admin 构建已带 `VITE_BASE=/admin/`（见 `cloudbaserc.json`）。

---

## 6. 与 Node SDK `rdb()` 的区别

| 方式 | 本项目 |
|------|--------|
| Prisma + `DATABASE_URL` | **采用**（与控制台 ORM 指引一致） |
| `cloudbase.rdb().from(...)` | **不采用**（需重写全部 Service） |

---

## 7. 常见问题

- **Prisma 未初始化 / 探活失败**：镜像构建需将 `prisma generate` 引擎写入 `pnpm deploy` 产物（见根目录 `Dockerfile`）；勿将 `apps/api/.env` 打入镜像（`**/.env` 已加入 `.dockerignore`）
- **连接失败**：确认云托管与 MySQL **同一环境**、使用 **内网** 地址、安全组放行 3306；控制台配置真实 `DATABASE_URL` 后需重新部署
- **表不存在**：执行 `prisma migrate deploy`
- **上传图片丢失**：容器本地 `uploads/` 非持久化，生产建议 COS（后续扩展）

本地开发仍用 `./dev.sh` + Docker MySQL，与 TCB 互不影响。
