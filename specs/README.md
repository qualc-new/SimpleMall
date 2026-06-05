# Specs 目录

中大型需求的**需求 → 设计 → 任务**三阶段产物存放处。

## 何时创建

- 跨 `api` / `web` / `admin` / `shared` 的变更
- 新功能、新状态机、验收标准不明确

小修复无需在此建目录。流程见 `.agents/skills/simplemall/references/spec-workflow/SKILL.md`。

## 目录结构

```text
specs/<kebab-name>/
├── requirements.md   # 需求与 EARS 验收标准
├── design.md         # 架构与模块设计
└── tasks.md          # 可勾选任务清单
```

模板：`harness/templates/spec-*.md`

## 示例

```text
specs/admin-coupon/
specs/order-refund-v2/
```

实现完成后保留 Spec 作为决策记录，并在 `docs/版本迭代说明.md` 中可引用。
