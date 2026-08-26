# Vendored copy

This is a vendored, patched copy of [felixmosh/turborepo-gh-artifacts@v4.1.1](https://github.com/felixmosh/turborepo-gh-artifacts/tree/v4.1.1) (commit `118f869397261f74bc39cb8565f2d02c0ed4209f`), MIT licensed (see `LICENSE`).

## Why vendored

`build:pkg`'s remote cache was disabled in this repo (see `turbo.json`) after cache hits repeatedly restored incomplete output. Root cause: `src/turboServer.ts`'s artifact-existence check calls GitHub's list-artifacts REST endpoint once, with no retry. That endpoint can lag behind a just-finalized upload by anywhere from tens of milliseconds to a few seconds, so a lookup made immediately after upload can get a false "not found" -- indistinguishable from the artifact never having existed.

## The patch

`src/utils/artifactApi.ts` gained `findArtifactByName()`, which retries the list-and-filter lookup with exponential backoff (3 retries, starting at 250ms) before giving up. `src/turboServer.ts`'s GET handler now calls this instead of doing a single inline lookup. Rebuilt with `yarn build` (rslib) against the pinned `v4.1.1` toolchain -- see `git log` in this repo for the exact diff.

## Upstream

Pending: file an issue + PR against felixmosh/turborepo-gh-artifacts with this fix. Once merged and released, drop this vendored copy and go back to the marketplace action.
