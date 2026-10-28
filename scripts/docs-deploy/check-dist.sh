#!/usr/bin/env bash
# Pre-flight for a docs build directory about to be uploaded to Cloudflare Pages.
#
# Usage: check-dist.sh <dir> [--untrusted]
#
# Always: fail on symlinks, fail when the build exceeds Cloudflare Pages' free-plan limits
# (20,000 files per deployment, 25 MiB per file) so the failure names the limit instead of
# surfacing as an opaque API error, and print the totals so growth is visible in the job log.
#
# --untrusted (a build produced by a pull request, possibly from a fork): additionally strip
# the files Cloudflare Pages treats as configuration or code rather than static content
# (`_worker.js`, `_routes.json`, `functions/`, `_headers`, `_redirects`). A PR could otherwise
# ship a Worker that runs on the preview origin. Preview deploys must only ever serve static files.
set -euo pipefail

dir="${1:?usage: check-dist.sh <dir> [--untrusted]}"
mode="${2:-}"

MAX_FILES=20000
MAX_FILE_BYTES=$((25 * 1024 * 1024))

[ -d "$dir" ] || { echo "::error::$dir is not a directory" >&2; exit 1; }

if [ "$mode" = "--untrusted" ]; then
  rm -rf "$dir/_worker.js" "$dir/_routes.json" "$dir/functions" "$dir/_headers" "$dir/_redirects"
fi

if [ -n "$(find "$dir" -type l -print -quit)" ]; then
  echo "::error::build output contains symlinks, which are not deployed" >&2
  find "$dir" -type l -print | head -20 >&2
  exit 1
fi

files="$(find "$dir" -type f | wc -l)"
bytes="$(du -sb "$dir" | cut -f1)"
echo "docs build: $files files, $((bytes / 1024 / 1024)) MiB"

if [ "$files" -gt "$MAX_FILES" ]; then
  echo "::error::$files files exceeds the Cloudflare Pages limit of $MAX_FILES per deployment" >&2
  exit 1
fi

big="$(find "$dir" -type f -size +"${MAX_FILE_BYTES}c" -print | head -5)"
if [ -n "$big" ]; then
  echo "::error::files over 25 MiB exceed the Cloudflare Pages per-file limit:" >&2
  echo "$big" >&2
  exit 1
fi
