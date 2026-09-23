#!/usr/bin/env bash
# SessionStart hook (startup matcher). Gives a session that starts in the primary checkout its
# own sibling worktree under ../warp-drive-worktrees/, branched from a freshly fetched
# origin/main, so it never builds or commits in the shared primary checkout -- see
# warp-drive-packages/memory-alpha/skills/contributors/start-in-a-fresh-worktree.md.
#
# Before creating one, prunes session worktrees this script created earlier that are safe to
# discard: no uncommitted/untracked changes, and every commit on the branch is already reachable
# from origin/main or from some other origin/* branch -- i.e. nothing sits only in that worktree.
# Pruning touches the network (a fetch), so it runs at most once per 24h via a stamp file in the
# repo's shared git dir, not on every session start.
set -uo pipefail

main=$(git -C "$CLAUDE_PROJECT_DIR" worktree list --porcelain | head -1 | sed 's|^worktree ||')
parent=$(cd "$(dirname "$main")" && pwd -P)
worktrees_dir="$parent/warp-drive-worktrees"
here=$(cd "$CLAUDE_PROJECT_DIR" && pwd -P)

prune_stale_session_worktrees() {
  local stamp="$(git -C "$main" rev-parse --git-common-dir)/warp-drive-last-prune"
  local now last
  now=$(date +%s)
  last=$(cat "$stamp" 2>/dev/null || echo 0)
  if [ $(( now - last )) -lt 86400 ]; then
    return 0
  fi
  echo "$now" >"$stamp"

  git -C "$main" fetch --quiet origin --prune || return 0

  git -C "$main" worktree list --porcelain | awk '
    /^worktree / { path=$2 }
    /^branch / { branch=$2; sub("refs/heads/", "", branch); print path, branch }
  ' | while read -r path branch; do
    case "$path" in "$worktrees_dir"/*) ;; *) continue ;; esac
    case "$branch" in session-[0-9]*) ;; *) continue ;; esac
    # Never prune the worktree this very session is running in, however clean it looks.
    [ "$path" = "$here" ] && continue

    if [ -n "$(git -C "$path" status --porcelain --untracked-files=all 2>/dev/null)" ]; then
      continue
    fi
    if git -C "$main" merge-base --is-ancestor "$branch" origin/main \
      || [ -n "$(git -C "$main" branch -r --contains "$branch" 2>/dev/null)" ]; then
      git -C "$main" worktree remove "$path" 2>/dev/null \
        && git -C "$main" branch -D "$branch" 2>/dev/null
    fi
  done
}

prune_stale_session_worktrees

if [ "$here" != "$main" ]; then
  echo "Already working in a worktree ($here); not creating a nested session worktree on top of it."
  exit 0
fi

ts=$(date +%s)
wt="$worktrees_dir/session-$ts"
git -C "$main" fetch --quiet origin main \
  && git -C "$main" worktree add -b "session-$ts" "$wt" origin/main >/dev/null 2>&1 \
  && echo "Sister worktree ready: $wt (branch session-$ts, from origin/main). Work there rather than in the primary checkout, and run 'pnpm install' in it before building or testing. It is a SIBLING of the repo on purpose -- see warp-drive-packages/memory-alpha/skills/contributors/start-in-a-fresh-worktree.md and do not relocate it inside the repo."

exit 0
