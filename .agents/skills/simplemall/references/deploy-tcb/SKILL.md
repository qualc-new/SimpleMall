---
name: simplemall-deploy-tcb
description: SimpleMall 腾讯云开发（TCB）部署。CloudRun API + /web /admin 静态托管。
version: 1.0.0
alwaysApply: false
---

# SimpleMall TCB 部署

## 前置

1. 读 `docs/TCB部署说明.md`
2. 配置根目录 `.env`（参考 `.env.tcb.example`、`deploy/tcb/env.example`）
3. 本地 `./harness/verify.sh all` 通过

## 部署顺序

```bash
# 1. API 镜像（CloudRun）
pnpm build:tcb:api
# 按文档 tcb framework deploy 或控制台发布

# 2. 静态站点
pnpm build:tcb:static    # 或分步 build:tcb:web / build:tcb:admin
pnpm deploy:tcb:static   # 上传到 /web、/admin、根重定向
```

## 关键脚本

| 脚本 | 作用 |
| ---- | ---- |
| `deploy/tcb/resolve-api-base.sh` | 校验 `NUXT_PUBLIC_API_BASE` / `VITE_API_BASE` |
| `deploy/tcb/build-static.sh` | 静态构建入口 |
| `deploy/tcb/deploy-static.sh` | 上传与路由 |
| `deploy/tcb/cleanup-legacy-web.sh` | 清理旧根路径 Web 资源 |

## 部署门控

- [ ] `cloudbaserc.json` 环境 ID 正确
- [ ] API `CORS_ORIGINS` 含静态托管域名
- [ ] Admin `VITE_BASE=/admin/`（TCB 子路径）
- [ ] 控制台 SPA 回退规则见 `hosting-routing-rules.example.json`
- [ ] 部署后：/web 商城、/admin 后台、API 健康检查

## CloudBase 平台问题

数据库、权限、CLI 细节 → `../../cloudbase/SKILL.md`
