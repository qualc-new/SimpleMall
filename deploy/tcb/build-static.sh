#!/usr/bin/env bash
# 构建 Web / Admin 静态资源（TCB 静态网站托管）
# 路径约定：Web → /web、Admin → /admin、根 / → 跳转页（见 deploy-static.sh）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy/tcb/load-tcb-env.sh
source "$ROOT/deploy/tcb/load-tcb-env.sh"
API_BASE="$("$ROOT/deploy/tcb/resolve-api-base.sh")"
WEB_BASE="${NUXT_APP_BASE_URL:-/web/}"
ADMIN_BASE="${VITE_BASE:-/admin/}"
ADMIN_API="${VITE_API_BASE:-$API_BASE}"
ADMIN_V2="${VITE_API_V2_BASE:-${API_BASE%/v1}/v2}"

echo "API v1: $API_BASE"
echo "API v2: $ADMIN_V2"

pnpm --filter @simplemall/shared build

NUXT_APP_BASE_URL="$WEB_BASE" NUXT_PUBLIC_API_BASE="$API_BASE" \
  pnpm --filter @simplemall/web generate

VITE_API_BASE="$ADMIN_API" VITE_API_V2_BASE="$ADMIN_V2" VITE_BASE="$ADMIN_BASE" \
  pnpm --filter @simplemall/admin build

echo ""
echo "构建完成："
echo "  Web:          apps/web/.output/public  → 托管路径 /web"
echo "  Admin:        apps/admin/dist          → 托管路径 /admin"
echo "  根跳转页:     deploy/tcb/root-redirect/index.html → 托管路径 /index.html"
echo ""
echo "上传：pnpm run deploy:tcb:static  或  bash deploy/tcb/deploy-static.sh"
