# SimpleMall — Agent 说明

本仓库为轻量电商 Monorepo（API + Nuxt Web + React Admin）。  
**Harness 工程化体系**见 [`docs/Harness工程化体系.md`](docs/Harness工程化体系.md)。

## 快速路由

| 我要… | 先读 |
| ----- | ---- |
| 了解文档与契约 | `docs/README.md` → `docs/共享接口与约定.md` |
| 做功能 / 修 bug | `.agents/skills/simplemall/SKILL.md` |
| 跨模块新功能 | `specs/README.md` + spec-workflow 技能 |
| 交付前自检 | `./harness/verify.sh types`（大改 `all`） |
| TCB 部署 | `docs/TCB部署说明.md` + deploy-tcb 技能 |
| 接续上次工作 | `harness/progress.md` |

## 必守规则

1. **项目规则**：`.cursor/rules/*.mdc`（全局：`harness-core`、`code-comments`、`version-changelog`）
2. **版本记录**：有交付价值时更新 `docs/版本迭代说明.md`
3. **接口契约**：改 API/枚举时同步 `docs/共享接口与约定.md`
4. **验证闭环**：代码交付前运行 `./harness/verify.sh types`；未通过不得声称完成
5. **进度交接**：开始/结束任务时更新 `harness/progress.md`

## 开发约定

- 本地开发优先 `./dev.sh`（MySQL + Redis + 三端）
- 共享枚举只定义在 `packages/shared`，变更顺序：shared → api → web/admin
- 勿在未要求时 `git commit` / `git push`

## 子目录 Agent 上下文（可选）

Monorepo 当前以根 `AGENTS.md` 为唯一入口；若后续子包复杂度上升，可在 `apps/api/AGENTS.md` 等追加路径级说明。
