# SimpleMall

轻量电商 Monorepo，架构与开发说明见 [docs/README.md](./docs/README.md)，版本记录见 [docs/版本迭代说明.md](./docs/版本迭代说明.md)。

## 技术栈

| 应用     | 路径         | 端口 |
| -------- | ------------ | ---- |
| API      | `apps/api`   | 4000 |
| Web 商城 | `apps/web`   | 3000 |
| 管理后台 | `apps/admin` | 5173 |

## 线上访问（腾讯云开发 TCB）

环境 ID：`qualc-free-d6gba939q4d76760d`

| 端       | 地址                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 商城     | [https://qualc-free-d6gba939q4d76760d-1251010392.tcloudbaseapp.com/web/](https://qualc-free-d6gba939q4d76760d-1251010392.tcloudbaseapp.com/web/)     |
| 管理后台 | [https://qualc-free-d6gba939q4d76760d-1251010392.tcloudbaseapp.com/admin/](https://qualc-free-d6gba939q4d76760d-1251010392.tcloudbaseapp.com/admin/) |

根路径 `/` 自动跳转至 `/web/`。线上账号与本地 seed 相同（管理端 `admin` / `admin123`，C 端 `13800138000` / `user123`）。

部署与变量配置见 [docs/TCB部署说明.md](./docs/TCB部署说明.md)；静态构建需根目录 `.env` 配置 `NUXT_PUBLIC_API_BASE` 等（参考 `.env.tcb.example`）。

## 快速开始（推荐 dev.sh）

```bash
pnpm install
chmod +x dev.sh
./dev.sh          # 自动：Docker → 迁移 → 启动 API/Web/Admin
```

首次启动后如需演示数据，可执行：`pnpm db:seed`

### 手动分步（不用 dev.sh 时）

```bash
pnpm install
pnpm db:up
cp apps/api/.env.example apps/api/.env   # Docker 默认 root:root
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### 默认账号（seed）

| 端       | 账号          | 密码       |
| -------- | ------------- | ---------- |
| 管理后台 | `admin`       | `admin123` |
| C 端演示 | `13800138000` | `user123`  |

## dev.sh 备注

### 启动顺序

```
Docker Desktop 已运行?
    → 否：提示并退出
    → 是：simplemall-mysql / simplemall-redis 未运行则 docker compose up -d
    → 等待 MySQL、Redis 就绪
    → 若无 apps/api/.env 则从 .env.example 复制
    → prisma migrate deploy
    → 编译 @simplemall/shared
    → 启动 api:4000、web:3000、admin:5173（端口占用则先杀再起）
```

### 命令一览

| 命令                         | 说明                              |
| ---------------------------- | --------------------------------- |
| `./dev.sh`                   | 一键启动（默认）                  |
| `./dev.sh stop`              | 只停三端 Node 进程                |
| `./dev.sh stop --all`        | 停三端 + 停 Docker 中 mysql/redis |
| `./dev.sh status`            | 查看容器与端口                    |
| `./dev.sh docker up`         | 只起数据库                        |
| `./dev.sh docker logs mysql` | 查看 MySQL 日志                   |

### 环境变量

| 变量           | 默认值 | 说明                                         |
| -------------- | ------ | -------------------------------------------- |
| `SKIP_DOCKER`  | —      | 设为 `1` 时使用本机 MySQL/Redis，不启 Docker |
| `SKIP_MIGRATE` | —      | 设为 `1` 时跳过 Prisma 迁移                  |
| `API_PORT`     | 4000   | API 端口                                     |
| `WEB_PORT`     | 3000   | 商城端口                                     |
| `ADMIN_PORT`   | 5173   | 后台端口                                     |

示例：`SKIP_DOCKER=1 ./dev.sh`、`API_PORT=4001 ./dev.sh`

### 日志与排错

| 路径                    | 内容            |
| ----------------------- | --------------- |
| `.dev/logs/api.log`     | Nest API 输出   |
| `.dev/logs/web.log`     | Nuxt 输出       |
| `.dev/logs/admin.log`   | Vite 后台输出   |
| `.dev/logs/migrate.log` | Prisma 迁移输出 |

- **Docker 未运行**：脚本直接报错，请先打开 Docker Desktop。
- **API 启动失败**：多为数据库连不上，检查 `apps/api/.env` 中 `DATABASE_URL` 是否与 `docker-compose.yml` 密码一致（默认 `root:root`）。
- **enum / shared 报错**：`dev.sh` 会自动 `pnpm --filter @simplemall/shared build`；若仍失败可手动执行该命令。
- **Nuxt `Failed to restrict vite-node socket permissions`（路径在 `/var/folders/.../T/`）**：macOS 系统临时目录路径超过约 104 字节，Nuxt vite-node 的 Unix socket 会创建失败。Web 已通过 `apps/web/scripts/dev.sh` 强制 `TMPDIR=/tmp`；请执行 `./dev.sh stop && ./dev.sh` 重启（勿在 IDE 里直接 `nuxt dev`，应走 `pnpm dev` 或 `./dev.sh`）。
- **Nuxt `Failed to resolve import "#app-manifest"`**：多为 `.nuxt` 未生成或 dev 被中断。已关闭 `experimental.appManifest`；请 `./dev.sh stop && ./dev.sh`，或 `cd apps/web && pnpm dev:clean`。

### Docker 容器（docker-compose.yml）

| 容器名             | 镜像           | 端口 | 备注                                |
| ------------------ | -------------- | ---- | ----------------------------------- |
| `simplemall-mysql` | mysql:8.0      | 3306 | 库名 `simplemall`，root 密码 `root` |
| `simplemall-redis` | redis:7-alpine | 6379 | 无密码                              |

## 其他常用命令

```bash
chmod +x dev.sh
./dev.sh
./dev.sh stop
./dev.sh status
```

或分别启动：

```bash
pnpm dev:api      # 仅 API
pnpm dev:web      # 仅商城
pnpm dev:admin    # 仅后台
pnpm build        # 构建全部
```

开发日志：`tail -f .dev/logs/api.log`（web / admin 同理）

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
