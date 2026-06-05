---
name: simplemall
description: >-
  SimpleMall 项目 Harness 技能入口。用于 Monorepo 开发、验证、Spec 工作流与 TCB 部署。
  关键词：SimpleMall、电商、NestJS、Nuxt、React Admin、verify、harness、spec、TCB 部署。
version: 1.0.0
alwaysApply: false
---

# SimpleMall Harness

## 激活契约

### 优先读本技能当

- 在 SimpleMall 仓库内做功能开发、修复、重构或部署
- 需要知道「交付前做什么」「跨模块怎么规划」
- 用户提到 harness、验证、spec、进度交接

### 然后按需读子技能

| 场景 | 子技能 |
| ---- | ------ |
| 交付前自检 | `references/verify/SKILL.md` |
| 中大型需求 | `references/spec-workflow/SKILL.md` |
| TCB 云托管/静态托管 | `references/deploy-tcb/SKILL.md` |
| CloudBase 平台通用能力 | `../cloudbase/SKILL.md` |

## 工程宪法

1. **约束优于指令**：遵守 `.cursor/rules/` 与 `docs/共享接口与约定.md`
2. **验证闭环**：代码交付前 `./harness/verify.sh types`（大改 `all`）
3. **上下文持久化**：更新 `harness/progress.md`；中大型任务用 `specs/<name>/`
4. **最小改动**：匹配现有命名与目录，不引入无关抽象
5. **勿擅自提交**：除非用户明确要求 `git commit` / `git push`

## Monorepo 速查

| 包 | 端口 | 启动 |
| --- | --- | --- |
| API | 4000 | `./dev.sh` 或 `pnpm dev:api` |
| Web | 3000 | `./dev.sh` 或 `pnpm dev:web` |
| Admin | 5173 | `./dev.sh` 或 `pnpm dev:admin` |

共享枚举：`packages/shared` → 先改 shared，再改 API，最后 Web/Admin。

## 文档索引

- 体系说明：`docs/Harness工程化体系.md`
- 接口契约：`docs/共享接口与约定.md`
- 发版记录：`docs/版本迭代说明.md`
- Agent 入口：根目录 `AGENTS.md`
