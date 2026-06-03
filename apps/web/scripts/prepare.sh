#!/usr/bin/env bash
set -euo pipefail
export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp
cd "$(dirname "$0")/.."
exec pnpm exec nuxt prepare "$@"
