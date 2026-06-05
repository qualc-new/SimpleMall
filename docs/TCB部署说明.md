# 腾讯云开发（TCB）部署说明 — Prisma 模式

> 业务数据库采用官方推荐的 **ORM → Prisma + 云开发 MySQL**，沿用现有 `PrismaService`，**不**使用 `@cloudbase/node-sdk` 的 `rdb()` API。

---

## 1. 架构

```
┌──────────────── CloudBase 环境 ────────────────┐
│  静态托管（同域名）                               │
│    /        → index.html 跳转 /web/              │
│    /web/*   → Nuxt 商城（NUXT_APP_BASE_URL）     │
│    /admin/* → React 管理端（VITE_BASE）          │
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
| 同域登录隔离 | Web `/web/login` 与 Admin `/admin/login` 路径分离 |

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
| `CORS_ORIGINS` | 静态站域名（同域部署填一个即可，如 `https://xxx.tcloudbaseapp.com`） |
| `CLOUDBASE_ENV_ID` | 写在根目录 `.env`，供 CLI 上传静态资源 |

**静态构建变量**（见 [`.env.tcb.example`](../.env.tcb.example)，写入根目录 `.env`）：

| 变量 | 说明 |
|------|------|
| `NUXT_PUBLIC_API_BASE` | **必填**，Web 构建写入 `apiBase`，须为云托管地址，如 `https://xxx.sh.run.tcloudbase.com/api/v1` |
| `VITE_API_BASE` / `VITE_API_V2_BASE` | **必填**，Admin v1/v2 接口根地址 |
| `NUXT_APP_BASE_URL` | 可选，默认 `/web/` |
| `VITE_BASE` | 可选，默认 `/admin/` |

未配置时 `build-static.sh` 会报错退出，避免产物内残留 `your-api-domain` 占位符。

---

## 4. 部署 API（云托管）

```bash
# 根目录
cp .env.tcb.example .env
# 编辑 CLOUDBASE_ENV_ID、NUXT_PUBLIC_API_BASE、VITE_API_BASE、VITE_API_V2_BASE

tcb login
tcb framework deploy
# 或仅构建镜像：pnpm run build:tcb:api
```

健康检查：`GET /api/v1/health`

---

## 5. 部署 Web / Admin（静态托管）

### 一键构建 + 上传

```bash
# 根目录 .env 已配置 CLOUDBASE_ENV_ID 与 API 地址后：
pnpm run deploy:tcb:static
```

等价于：

```bash
bash deploy/tcb/build-static.sh   # 仅构建
bash deploy/tcb/deploy-static.sh  # 构建并 tcb hosting deploy
```

上传目标：

| 本地目录 | 托管路径 |
|----------|----------|
| `apps/web/.output/public` | `/web` |
| `apps/admin/dist` | `/admin` |
| `deploy/tcb/root-redirect/index.html` | `/index.html` |

### 从旧方案（Web 在根 `/`）迁移

旧环境根路径常有 `login/`、`products/` 等，会与 `/web/login` 冲突。新方案上传后执行：

```bash
bash deploy/tcb/cleanup-legacy-web.sh --dry-run   # 预览
bash deploy/tcb/cleanup-legacy-web.sh --yes       # 删除根路径旧 Web 文件
```

### SPA 回退规则（推荐）

控制台 → **静态网站托管** → **网站配置**，或使用 `manageHosting` 的 `setWebsiteDocument`，参考：

[`deploy/tcb/hosting-routing-rules.example.json`](../deploy/tcb/hosting-routing-rules.example.json)

- `/web/*` 404 → `web/200.html`（Nuxt SPA）
- `/admin/*` 404 → `admin/index.html`（React SPA）

---

## 6. 与 Node SDK `rdb()` 的区别

| 方式 | 本项目 |
|------|--------|
| Prisma + `DATABASE_URL` | **采用**（与控制台 ORM 指引一致） |
| `cloudbase.rdb().from(...)` | **不采用**（需重写全部 Service） |

---

## 7. 常见问题

- **接口 404 / 请求 your-api-domain**：静态构建未配置 API 地址。在 `.env` 填写云托管 `NUXT_PUBLIC_API_BASE` 等后重新 `pnpm run deploy:tcb:static`。
- **Web / Admin 登录冲突**：确认 Web 在 `/web`、Admin 在 `/admin`，且已删除根路径旧 `login/`；Admin 需带 `basename` 构建（v0.10.0+）。
- **Prisma 未初始化 / 探活失败**：镜像构建需将 `prisma generate` 引擎写入 `pnpm deploy` 产物；勿将 `apps/api/.env` 打入镜像。
- **连接失败**：云托管与 MySQL **同一环境**、使用 **内网** 地址；配置 `DATABASE_URL` 后重新部署。
- **表不存在**：执行 `prisma migrate deploy`。
- **上传图片丢失**：容器本地 `uploads/` 非持久化，生产建议 COS（后续扩展）。
- **刷新子路由 404**：配置第 5 节 SPA 回退规则。

本地开发仍用 `./dev.sh` + Docker MySQL，与 TCB 互不影响（不设 `NUXT_APP_BASE_URL` / `VITE_BASE`）。
