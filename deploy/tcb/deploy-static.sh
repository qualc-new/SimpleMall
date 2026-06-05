#!/usr/bin/env bash
# 构建并上传 Web(/web)、Admin(/admin)、根跳转(/) 到 TCB 静态托管
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ENV_ID="${CLOUDBASE_ENV_ID:-}"
if [ -z "$ENV_ID" ] && [ -f .env ]; then
  # shellcheck disable=SC2002
  ENV_ID="$(grep -E '^CLOUDBASE_ENV_ID=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs)"
fi
if [ -z "$ENV_ID" ]; then
  echo "错误：请 export CLOUDBASE_ENV_ID=你的环境ID，或在根目录 .env 中配置" >&2
  exit 1
fi

bash deploy/tcb/build-static.sh

echo "上传到环境 $ENV_ID …"
tcb hosting deploy apps/web/.output/public /web --env-id "$ENV_ID" --yes
tcb hosting deploy apps/admin/dist /admin --env-id "$ENV_ID" --yes
tcb hosting deploy deploy/tcb/root-redirect/index.html /index.html --env-id "$ENV_ID" --yes

echo ""
echo "上传完成。访问："
echo "  商城：  https://<静态域名>/web/"
echo "  后台：  https://<静态域名>/admin/"
echo "  根路径：https://<静态域名>/  → 自动跳转 /web/"
echo ""
echo "若从旧方案（Web 在根路径 /）迁移，请删除根下遗留目录，避免 /login 与 /web/login 并存："
echo "  login products cart checkout orders register search user _nuxt 等（保留 /web /admin /index.html）"
echo "  示例：tcb hosting delete login --dir --env-id $ENV_ID --yes"
echo ""
echo "建议在控制台「静态网站托管 → 网站配置」配置 SPA 回退规则，参考："
echo "  deploy/tcb/hosting-routing-rules.example.json"
