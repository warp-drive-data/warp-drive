#!/usr/bin/env bash
# WorktreeCreate hook. Fires for `--worktree`, `EnterWorktree`, subagents with
# `isolation: worktree`, and background sessions -- anywhere Claude Code would otherwise
# create a worktree under the default, nested `.claude/worktrees/<name>/`. Replacing the
# default here is what lets those mechanisms be used directly in this repo instead of via
# manual `git worktree add`: see
# warp-drive-packages/memory-alpha/skills/contributors/start-in-a-fresh-worktree.md.
#
# Configuring this hook opts out of Claude Code's default git worktree logic entirely
# (including the `worktree.baseRef` setting), so this script does its own basing: always a
# freshly fetched `origin/main`, matching this repo's rule that a worktree never branches off
# a checkout's current HEAD.
#
# Contract: stdout's last non-empty line must be the created worktree's absolute path, with
# no `.`/`..` segments (Claude Code rejects those) and no symlink component below the repo
# root. Everything else must go to stderr.
set -euo pipefail

input=$(cat)
name=$(jq -r '.name' <<<"$input")
cwd=$(jq -r '.cwd' <<<"$input")

main=$(git -C "$cwd" worktree list --porcelain | head -1 | sed 's|^worktree ||')
parent=$(cd "$(dirname "$main")" && pwd -P)
dir="$parent/warp-drive-worktrees/$name"
branch="worktree-$name"

# A name Claude Code (or a user passing --worktree the same name twice) already created a
# worktree for -- reopen it rather than failing on the now-existing directory and branch.
if [ -d "$dir" ]; then
  echo "$dir"
  exit 0
fi

timeout 5 git -C "$main" fetch --quiet origin main 1>&2 || true
git -C "$main" worktree add -b "$branch" "$dir" origin/main 1>&2

echo "$dir"
