#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIRS_FILE="$ROOT_DIR/tools/internal-config/oxlint/scoped-dirs.txt"
TYPE_AWARE_DIRS_FILE="$ROOT_DIR/tools/internal-config/oxlint/type-aware-scoped-dirs.txt"

mapfile -t dirs < <(grep -v '^\s*#' "$DIRS_FILE" | grep -v '^\s*$')
mapfile -t type_aware_dirs < <(grep -v '^\s*#' "$TYPE_AWARE_DIRS_FILE" | grep -v '^\s*$')

cd "$ROOT_DIR"

# Type-aware pass over every package listed in type-aware-scoped-dirs.txt (currently
# identical to scoped-dirs.txt in full). Its rules are at "error" in .oxlintrc.json and
# replace ESLint's type-aware rules wherever tools/internal-config/eslint/oxlint.js's
# disabledTypeAwareRules() is wired in.
node_modules/.bin/oxlint --type-aware "$@" "${type_aware_dirs[@]}"
type_aware_status=$?

node_modules/.bin/oxlint "$@" "${dirs[@]}"
status=$?

exit $(( type_aware_status > status ? type_aware_status : status ))
