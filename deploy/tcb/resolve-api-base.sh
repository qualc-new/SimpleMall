#!/usr/bin/env bash
# 解析静态构建用的 API v1 根地址（须以 /api/v1 结尾，无尾斜杠）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=deploy/tcb/load-tcb-env.sh
source "$ROOT/deploy/tcb/load-tcb-env.sh"

pick() {
  local v="${1:-}"
  v="${v%/}"
  if [ -n "$v" ] && [[ "$v" != *your-api-domain* ]]; then
    echo "$v"
    return 0
  fi
  return 1
}

if pick "${NUXT_PUBLIC_API_BASE:-}"; then exit 0; fi
if pick "${VITE_API_BASE:-}"; then exit 0; fi
if pick "${TCB_API_BASE:-}"; then exit 0; fi

echo "错误：未配置 TCB 静态构建 API 地址（当前为占位符或未设置）。" >&2
echo "请在根目录 .env 中设置（可复制 .env.tcb.example）：" >&2
echo "  NUXT_PUBLIC_API_BASE=https://<云托管默认域名>/api/v1" >&2
echo "  VITE_API_BASE=https://<云托管默认域名>/api/v1" >&2
echo "  VITE_API_V2_BASE=https://<云托管默认域名>/api/v2" >&2
echo "云托管域名见控制台 → 云托管 → simplemall-api → 默认公网访问地址。" >&2
exit 1
