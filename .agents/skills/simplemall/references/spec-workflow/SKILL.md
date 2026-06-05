---
name: simplemall-spec-workflow
description: >-
  SimpleMall 中大型需求 Spec 工作流。跨模块、新功能、验收模糊时使用。
  关键词：spec、需求、设计、任务拆分、EARS。
version: 1.0.0
alwaysApply: false
---

# SimpleMall Spec 工作流

## 决策

**走 Spec**（先规划再编码）：

- 跨 api/web/admin/shared 任一以上
- 新页面、新状态机、新 API 域
- 用户未给出明确验收标准

**跳过 Spec**（直接实现）：

- 单文件 bug、typo、明确的一行修复
- 用户明确说「直接改」

## 三阶段

### 1. 需求 → `specs/<kebab-name>/requirements.md`

- 复制 `harness/templates/spec-requirements.md`
- 用 EARS 写验收标准
- **用户确认后再进入设计**

### 2. 设计 → `specs/<kebab-name>/design.md`

- 复制 `harness/templates/spec-design.md`
- 标明影响的 `apps/*` 与 `packages/shared`
- 若改接口，列出 `docs/共享接口与约定.md` 需同步的章节
- **用户确认后再进入任务**

### 3. 任务 → `specs/<kebab-name>/tasks.md`

- 复制 `harness/templates/spec-tasks.md`
- 每项可勾选、可映射到验证命令
- 实现时按 Phase 顺序；每完成一项更新 `harness/progress.md`

## 命名

- 目录：`specs/coupon-checkout/`（kebab-case，英文或拼音）
- 实现完成后 Spec **保留**作决策记录，不删除

## 与版本文档

交付完成后在 `docs/版本迭代说明.md` 引用 Spec 目录名（可选一行链接）。
