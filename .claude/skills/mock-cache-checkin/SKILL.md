---
name: mock-cache-checkin
description: Ensures `.mock-cache` fixture directories under `tests/*` are staged and committed whenever a change adds or modifies a test that uses `@warp-drive/holodeck`'s mock server (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`mock()`). Use before finalizing any commit or opening a PR in this repo, especially from a worktree or agent session where it's easy to stage only the files a task explicitly touched — local test runs silently regenerate these fixtures and it's easy to leave them out of the changeset.
user-invocable: false
---

# Holodeck mock-cache check-in

Read and follow
[`warp-drive-packages/memory-alpha/skills/contributors/commit-mock-cache-fixtures.md`](../../../warp-drive-packages/memory-alpha/skills/contributors/commit-mock-cache-fixtures.md).

That file is the canonical version of this rule. It lives in `@warp-drive/memory-alpha` so every
agent working in this repo reaches it through the contributor index, not only Claude Code. This
file exists to trigger at commit time and route you there.
