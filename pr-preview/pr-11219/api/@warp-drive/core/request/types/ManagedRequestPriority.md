---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/request/types/ManagedRequestPriority.md
---

# &#x20;ManagedRequestPriority

```ts
type ManagedRequestPriority = {
  blocking: boolean;
};
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:50](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/request/-private/types.ts#L50)

Describes whether a managed (deduped) request should be treated as
blocking the caller's promise (e.g. a `fetch`) or as a non-blocking
background reload that other requests may dedupe against without
waiting on it.

## Properties

### blocking

```ts
blocking: boolean;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:52](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/request/-private/types.ts#L52)

Whether the request should gate the promise it is associated with.
