#!/usr/bin/env bash
# 各包 TypeScript 类型检查（不启动服务）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [harness] shared 构建与类型检查"
pnpm --filter @simplemall/shared build

echo "==> [harness] API 类型检查（nest build）"
pnpm --filter @simplemall/api build

echo "==> [harness] Admin 类型检查（vite build）"
pnpm --filter @simplemall/admin build

echo "==> [harness] Web 类型检查（nuxt prepare + build）"
pnpm --filter @simplemall/web prepare:nuxt
pnpm --filter @simplemall/web build

echo "==> [harness] 类型检查全部通过"
