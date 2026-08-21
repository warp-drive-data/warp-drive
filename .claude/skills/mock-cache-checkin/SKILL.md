---
name: mock-cache-checkin
description: Ensures `.mock-cache` fixture directories under `tests/*` are staged and committed whenever a change adds or modifies a test that uses `@warp-drive/holodeck`'s mock server (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`mock()`). Use before finalizing any commit or opening a PR in this repo, especially from a worktree or agent session where it's easy to stage only the files a task explicitly touched — local test runs silently regenerate these fixtures and it's easy to leave them out of the changeset.
user-invocable: false
---

# Holodeck mock-cache check-in

## Why this matters

`@warp-drive/holodeck` records real HTTP request/response fixtures to disk under
`tests/*/.mock-cache/<testId>/...` (hash-named directories, `.body.br` + `.meta.json` files)
and replays them on later runs instead of re-generating the response live. It looks like a
build artifact or local scratch cache — it is not. Per `packages/holodeck/server/utils.js`:

> the `.mock-cache` directory should be checked-in to the codebase

Locally, recording is the *default* behavior, not something you opt into. See
`warp-drive-packages/build-config/src/-private/utils/get-env.ts`:

```ts
const SHOULD_RECORD = Boolean(!CI || IS_RECORDING);
```

Whenever `CI` isn't set in the environment (any normal local run, including one driven by an
agent), every `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`mock()` call from
`@warp-drive/holodeck` writes a fresh fixture into `.mock-cache` instead of validating against
one that's already there — silently, with no warning. CI runs in replay-only mode: if a test's
fixture was never committed, CI fails with "No meta was found for ... You may need to record a
mock for this request" — but only later, in whatever environment first enforces replay.

## What to do before finalizing a commit or PR

1. Run `git status` and look for new or modified paths under `**/.mock-cache/`.
2. If the change added or modified a test that touches the mock server, its fixture(s) under
   `.mock-cache` **must** be staged and committed alongside the test — they're as much a part
   of the change as the test file itself, not build output to ignore.
3. Don't reflexively exclude `.mock-cache` paths because they look like generated/cache
   content, and don't assume "not part of what I was asked to change" applies to them the way
   it would to an actual build artifact.
4. If unrelated `.mock-cache` entries appear just from running the existing suite (not tied to
   anything the current change touched), that's pre-existing drift, not something to fold into
   an unrelated PR — leave those alone and mention it rather than committing fixture noise.

## Verifying a fixture actually satisfies replay

Running tests without `CI` set will always "pass" locally even for a brand-new fixture, because
it just recorded what it needed rather than replaying and validating. To actually exercise
replay mode before pushing:

```sh
CI=1 pnpm test
```

If a needed fixture is missing, this is what surfaces it — the same way CI will.
