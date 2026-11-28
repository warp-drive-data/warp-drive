---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/request/types/ManagedRequestPriority.md
description: >-
  Marks whether a deduped managed request blocks its caller's promise or runs as
  a non-blocking background reload.
---

# &#x20;ManagedRequestPriority

```ts
type ManagedRequestPriority = {
  blocking: boolean;
};
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:54](https://github.com/warp-drive-data/warp-drive/blob/37b729cb1f8483d0de8bbbe89258e7a61745f8ed/warp-drive-packages/core/src/request/-private/types.ts#L54)

Describes whether a managed (deduped) request should be treated as
blocking the caller's promise (e.g. a `fetch`) or as a non-blocking
background reload that other requests may dedupe against without
waiting on it.

## Properties

### blocking

```ts
blocking: boolean;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:56](https://github.com/warp-drive-data/warp-drive/blob/37b729cb1f8483d0de8bbbe89258e7a61745f8ed/warp-drive-packages/core/src/request/-private/types.ts#L56)

Whether the request should gate the promise it is associated with.
