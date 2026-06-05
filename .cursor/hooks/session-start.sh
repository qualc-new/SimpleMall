#!/usr/bin/env bash
# 会话启动时注入 Harness 上下文
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROGRESS="$ROOT/harness/progress.md"

context="SimpleMall Harness 已加载。交付前运行 ./harness/verify.sh types；跨模块任务先走 specs/ 流程。详见 docs/Harness工程化体系.md。"

if [[ -f "$PROGRESS" ]]; then
  # 提取「当前焦点」区块（最多 20 行）
  focus=$(awk '/^## 当前焦点/{found=1; next} /^## /{if(found) exit} found{print}' "$PROGRESS" | head -20)
  if [[ -n "$focus" ]]; then
    context="$context

## harness/progress.md 当前焦点
$focus"
  fi
fi

jq -n --arg ctx "$context" '{ "additional_context": $ctx }'
