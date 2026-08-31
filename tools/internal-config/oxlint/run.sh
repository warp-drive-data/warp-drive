#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIRS_FILE="$ROOT_DIR/tools/internal-config/oxlint/scoped-dirs.txt"
TYPE_AWARE_DIRS_FILE="$ROOT_DIR/tools/internal-config/oxlint/type-aware-scoped-dirs.txt"

mapfile -t dirs < <(grep -v '^\s*#' "$DIRS_FILE" | grep -v '^\s*$')
mapfile -t type_aware_dirs < <(grep -v '^\s*#' "$TYPE_AWARE_DIRS_FILE" | grep -v '^\s*$')

cd "$ROOT_DIR"

# Additive type-aware pass over the subset of packages whose tsconfig.json
# tsgolint can actually parse — see type-aware-scoped-dirs.txt. Its rules are
# configured at "warn" in .oxlintrc.json for now, so this can't fail the
# build; it exists to surface findings while we build confidence in it, not
# yet to replace ESLint's type-aware rules.
node_modules/.bin/oxlint --type-aware "$@" "${type_aware_dirs[@]}"
type_aware_status=$?

node_modules/.bin/oxlint "$@" "${dirs[@]}"
status=$?

exit $(( type_aware_status > status ? type_aware_status : status ))
