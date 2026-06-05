#!/usr/bin/env bash
# Agent 结束时提醒验证与进度更新
set -euo pipefail

input=$(cat)
# 若会话中无文件编辑，status 可能为 completed；仍温和提醒
status=$(echo "$input" | jq -r '.status // "unknown"')

if [[ "$status" == "completed" || "$status" == "unknown" ]]; then
  jq -n '{
    "followup_message": "若本次有代码交付：1) 运行 ./harness/verify.sh types；2) 按需更新 docs/版本迭代说明.md 与 harness/progress.md。"
  }'
else
  echo '{}'
fi
