#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIRS_FILE="$ROOT_DIR/tools/internal-config/oxlint/scoped-dirs.txt"

mapfile -t dirs < <(grep -v '^\s*#' "$DIRS_FILE" | grep -v '^\s*$')

cd "$ROOT_DIR"
exec node_modules/.bin/oxlint "$@" "${dirs[@]}"
