#!/usr/bin/env bash
# 拦截高风险 git 命令，要求人工确认
set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if [[ "$command" =~ git[[:space:]]+push.*--force ]] || \
   [[ "$command" =~ git[[:space:]]+push[[:space:]]+-f ]] || \
   [[ "$command" =~ git[[:space:]]+reset[[:space:]]+--hard ]] || \
   [[ "$command" =~ git[[:space:]]+clean[[:space:]]+-f ]] || \
   [[ "$command" =~ git[[:space:]]+checkout[[:space:]]+\. ]]; then
  jq -n '{
    "permission": "ask",
    "user_message": "此 git 命令可能造成不可恢复的变更，请确认后再执行。",
    "agent_message": "Harness 拦截了高风险 git 操作；仅在用户明确要求时继续。"
  }'
  exit 0
fi

echo '{ "permission": "allow" }'
