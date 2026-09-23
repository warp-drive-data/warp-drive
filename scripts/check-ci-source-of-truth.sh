#!/usr/bin/env bash
# PreToolUse hook (Bash matcher). Reminds an agent, every time it's about to run a local
# test/lint/build command, to check whether the current change is already on an open PR first.
# See warp-drive-packages/memory-alpha/skills/contributors/use-ci-as-the-source-of-truth.md --
# this hook exists because reading that skill once at session start doesn't survive a task that
# only later grows a code change worth verifying.
set -euo pipefail

cmd=$(jq -r '.tool_input.command // ""')

if echo "$cmd" | grep -qE '\b(mocha|oxlint|oxfmt|eslint|tsc)\b' \
  || echo "$cmd" | grep -qE '\bpnpm\b[[:space:]]+(run[[:space:]]+)?(test|lint)[a-zA-Z0-9:_-]*\b'; then
  msg="Reminder (use-ci-as-the-source-of-truth skill): before trusting this local check, confirm the current change is already pushed to an open PR. CI on that PR is the source of truth, not this local run -- if there is no open PR yet, commit, push, and open one first, then read CI's results rather than relying on this."
  jq -n --arg msg "$msg" '{hookSpecificOutput: {hookEventName: "PreToolUse", additionalContext: $msg}}'
fi
