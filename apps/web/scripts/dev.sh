#!/usr/bin/env bash
# macOS 默认临时目录路径过长，会导致 nuxt vite-node socket chmod ENOENT
set -euo pipefail
export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp
cd "$(dirname "$0")/.."
exec pnpm exec nuxt dev --port "${PORT:-3000}" "$@"
