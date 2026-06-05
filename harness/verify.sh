#!/usr/bin/env bash
# Harness 主验证入口：Agent 交付前自检
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-all}"

case "$MODE" in
  types)
    bash harness/verify-types.sh
    ;;
  build)
    bash harness/verify-build.sh
    ;;
  all)
    bash harness/verify-types.sh
    bash harness/verify-build.sh
    ;;
  *)
    echo "用法: ./harness/verify.sh [types|build|all]" >&2
    exit 1
    ;;
esac

echo ""
echo "[OK] Harness verify done ($MODE)"
