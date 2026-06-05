---
name: simplemall-verify
description: SimpleMall 交付前验证流程。关键词：verify、类型检查、构建验证、harness verify。
version: 1.0.0
alwaysApply: false
---

# SimpleMall 验证

## 何时运行

| 改动范围 | 命令 |
| -------- | ---- |
| 单文件小修、文档 | 可跳过或仅 `types` |
| TS/逻辑变更 | `./harness/verify.sh types` |
| 构建配置、依赖、跨端 | `./harness/verify.sh all` |
| TCB 部署前 | `all` + 按 `deploy-tcb` 技能检查 |

## 命令

```bash
./harness/verify.sh types   # shared + api + admin + web 生产构建验证
./harness/verify.sh build   # pnpm build 全量
./harness/verify.sh all     # types + build
```

等价 npm scripts：`pnpm verify`、`pnpm verify:types`、`pnpm verify:build`

## 验证失败时

1. 读完整错误输出，从 **shared** 开始修（下游依赖它）
2. API 报错常见原因：未先 `shared build`、Prisma 类型过期
3. Web 报错：先 `pnpm --filter @simplemall/web prepare:nuxt`
4. 修完重跑，直至通过再声称交付完成

## 不替代

- 手动 UI 走查（Web 响应式见 `web-responsive.mdc`）
- 集成测试（仓库暂无自动化测试套件）
- 生产环境冒烟（TCB 部署后人工验证）
