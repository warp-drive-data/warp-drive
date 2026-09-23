#!/usr/bin/env bash
# PostToolUse hook (Bash matcher, filtered to `git push` via the `if` rule in
# .claude/settings.json). A pushed branch with a finished change is supposed to become a PR --
# see warp-drive-packages/memory-alpha/skills/contributors/submit-a-pr.md -- but that step is
# easy to skip once the push itself succeeds. This checks GitHub for an open PR on the branch
# just pushed and, if none exists, blocks with a reminder to open one.
set -euo pipefail

success=$(jq -r 'if .tool_response.success == false then "false" else "true" end' 2>/dev/null) || success=true
if [[ "$success" != "true" ]]; then
  exit 0
fi

token="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "$token" ]]; then
  exit 0
fi

remote_url=$(git remote get-url origin 2>/dev/null) || exit 0
repo_slug=$(echo "$remote_url" | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##')
owner="${repo_slug%%/*}"
if [[ -z "$repo_slug" || -z "$owner" || "$repo_slug" == "$owner" ]]; then
  exit 0
fi

branch=$(git branch --show-current 2>/dev/null) || exit 0
if [[ -z "$branch" ]]; then
  exit 0
fi

response=$(curl -sS --max-time 10 \
  -H "Authorization: Bearer $token" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$repo_slug/pulls?head=$owner:$branch&state=all") || exit 0

count=$(echo "$response" | jq 'if type == "array" then length else -1 end' 2>/dev/null) || exit 0
if [[ "$count" -lt 0 ]]; then
  # Unexpected (non-array) response -- e.g. an API error body -- fail open rather than
  # block on a reminder that might be wrong.
  exit 0
fi
if [[ "$count" -gt 0 ]]; then
  exit 0
fi

reason="The branch '$branch' was just pushed but has no pull request yet (open or closed) against warp-drive-data/warp-drive. Read warp-drive-packages/memory-alpha/skills/contributors/submit-a-pr.md and open one against main with the mcp__github tools now that the change is pushed -- in this repo a finished, pushed change is expected to become a PR, which overrides any general default of only opening one when explicitly asked."
jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
