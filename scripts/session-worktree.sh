#!/usr/bin/env bash
# SessionStart hook (matcher: startup). Makes sure an agent session has a worktree of its own,
# per warp-drive-packages/memory-alpha/skills/contributors/start-in-a-fresh-worktree.md, and
# prunes the session worktrees earlier sessions left behind so `git worktree list` stays readable.
#
# Two starting points:
#   - The session starts in the primary checkout (remote sessions always do; a local one does
#     when launched from the main clone). A fresh sibling worktree <repo>-session-<epoch> is
#     created from origin/main and announced, as before.
#   - The session starts inside a worktree already (a local user's own tooling put it there).
#     That worktree is the session's; nothing new is created, so tooling-managed layouts don't
#     accumulate unused session worktrees next to them.
#
# In both cases stale session worktrees are pruned first. One is pruned only when all hold:
#   - its directory is <repo>-session-<epoch> and it is at least MAX_AGE seconds old
#     (default one hour), so a session that is still starting up is never touched;
#   - it is still on its own auto-created branch session-<epoch>;
#   - `git status --porcelain` is empty, so no edits and no untracked files;
#   - it has no commits that are not already on origin/main.
# Anything else -- a renamed branch, a dirty tree, local commits -- is left alone.
#
# Stdout is shown to the agent as session context; keep it to the one message it needs.
set -euo pipefail
trap 'echo "Error on line $LINENO" >&2' ERR

log() { echo "[$(basename "$0")] $*" >&2; }
die() { echo "ERROR [$(basename "$0")]: $*" >&2; exit 1; }

[[ -n "${CLAUDE_PROJECT_DIR:-}" ]] || die "CLAUDE_PROJECT_DIR is not set"
MAX_AGE=${SESSION_WORKTREE_MAX_AGE:-3600}

# The primary checkout is always the first entry in `git worktree list`, even when the hook runs
# from inside a worktree.
main=$(git -C "$CLAUDE_PROJECT_DIR" worktree list --porcelain | head -1 | sed 's|^worktree ||')
[[ -d "$main" ]] || die "could not locate the primary checkout from $CLAUDE_PROJECT_DIR"
parent=$(dirname "$main")
base=$(basename "$main")
now=$(date +%s)
project_dir=$(cd "$CLAUDE_PROJECT_DIR" && pwd -P)
main_dir=$(cd "$main" && pwd -P)

git -C "$main" fetch --quiet origin main || die "git fetch origin main failed"

pruned=0
for wt in "$parent/$base"-session-*; do
  [[ -d "$wt" ]] || continue
  [[ "$(cd "$wt" && pwd -P)" != "$project_dir" ]] || continue
  ts=${wt##*-session-}
  [[ "$ts" =~ ^[0-9]+$ ]] || continue
  (( now - ts >= MAX_AGE )) || continue
  branch=$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null) || continue
  [[ "$branch" == "session-$ts" ]] || continue
  [[ -z "$(git -C "$wt" status --porcelain)" ]] || continue
  [[ -z "$(git -C "$wt" log --oneline origin/main..HEAD)" ]] || continue
  if git -C "$main" worktree remove "$wt" && git -C "$main" branch -D "$branch" >/dev/null; then
    pruned=$((pruned + 1))
  else
    log "could not prune $wt; leaving it in place"
  fi
done
git -C "$main" worktree prune

summary=""
if (( pruned > 0 )); then
  summary=" Pruned $pruned stale session worktree(s) from earlier sessions."
fi

if [[ "$project_dir" != "$main_dir" ]]; then
  echo "This session started inside the worktree $project_dir; work there. No new session worktree was created.$summary"
  exit 0
fi

wt="$parent/$base-session-$now"
if ! git -C "$main" worktree add -b "session-$now" "$wt" origin/main >/dev/null 2>&1; then
  log "could not create $wt; work in an existing worktree or create one by hand"
  exit 0
fi

echo "Sister worktree ready: $wt (branch session-$now, from origin/main). Work there rather than in the primary checkout, and run 'pnpm install' in it before building or testing. It is a SIBLING of the repo on purpose -- see warp-drive-packages/memory-alpha/skills/contributors/start-in-a-fresh-worktree.md and do not relocate it inside the repo.$summary"
