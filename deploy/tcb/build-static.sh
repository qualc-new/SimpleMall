#!/usr/bin/env bash
# 构建 Web / Admin 静态资源（TCB 静态网站托管）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

API_BASE="${NUXT_PUBLIC_API_BASE:-${VITE_API_BASE:-https://your-api-domain/api/v1}}"
ADMIN_API="${VITE_API_BASE:-$API_BASE}"
ADMIN_V2="${VITE_API_V2_BASE:-${API_BASE%/v1}/v2}"

pnpm --filter @simplemall/shared build
NUXT_PUBLIC_API_BASE="$API_BASE" pnpm --filter @simplemall/web generate
VITE_API_BASE="$ADMIN_API" VITE_API_V2_BASE="$ADMIN_V2" VITE_BASE="${VITE_BASE:-/admin/}" \
  pnpm --filter @simplemall/admin build

echo "Web:   apps/web/.output/public"
echo "Admin: apps/admin/dist"
