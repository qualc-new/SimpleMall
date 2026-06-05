#!/usr/bin/env bash
# 删除 TCB 托管根路径下旧版 Web 产物（迁移到 /web 后执行，避免 /login 与商城登录冲突）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ENV_ID="${CLOUDBASE_ENV_ID:-}"
if [ -z "$ENV_ID" ] && [ -f .env ]; then
  # shellcheck disable=SC2002
  ENV_ID="$(grep -E '^CLOUDBASE_ENV_ID=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs)"
fi
if [ -z "$ENV_ID" ]; then
  echo "错误：请 export CLOUDBASE_ENV_ID=你的环境ID" >&2
  exit 1
fi

# 根路径旧 Web 常见目录/文件（勿删 web/ admin/ index.html）
LEGACY_PATHS=(
  _nuxt
  _payload.json
  200.html
  404.html
  cart
  checkout
  login
  orders
  products
  register
  search
  user
  categories
)

DRY="${1:-}"
if [ "$DRY" = "--dry-run" ]; then
  echo "预览将删除的根路径（--env-id $ENV_ID）："
  for p in "${LEGACY_PATHS[@]}"; do
    tcb hosting delete "$p" --dir --env-id "$ENV_ID" --dry-run 2>/dev/null || \
      tcb hosting delete "$p" --env-id "$ENV_ID" --dry-run 2>/dev/null || true
  done
  echo "确认后执行：bash deploy/tcb/cleanup-legacy-web.sh --yes"
  exit 0
fi

if [ "$DRY" != "--yes" ]; then
  echo "将删除根路径旧 Web 产物。先预览：bash deploy/tcb/cleanup-legacy-web.sh --dry-run"
  echo "确认删除：bash deploy/tcb/cleanup-legacy-web.sh --yes"
  exit 0
fi

for p in "${LEGACY_PATHS[@]}"; do
  echo "删除 $p …"
  # 先删目录内 index.html，再删目录（CLI 仅 --dir 时可能漏删子文件）
  tcb hosting delete "$p/index.html" --env-id "$ENV_ID" --yes 2>/dev/null || true
  tcb hosting delete "$p" --env-id "$ENV_ID" --yes 2>/dev/null || true
  tcb hosting delete "$p" --dir --env-id "$ENV_ID" --yes 2>/dev/null || \
    echo "  （跳过：$p 不存在或已删除）"
done

echo "清理完成。"
