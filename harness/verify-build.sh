#!/usr/bin/env bash
# 全量构建验证（shared + 三端产物）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [harness] 全量构建"
pnpm build

echo "==> [harness] 构建验证通过"
