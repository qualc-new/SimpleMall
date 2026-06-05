#!/usr/bin/env bash
# 读取根目录 .env 中的 TCB / API 构建变量（不覆盖已 export 的值）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env"

[ -f "$ENV_FILE" ] || return 0

while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [ -z "$line" ] && continue
  [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
  key="${line%%=*}"
  # shellcheck disable=SC2163
  [ -n "${!key:-}" ] && continue
  export "$line"
done < "$ENV_FILE"
