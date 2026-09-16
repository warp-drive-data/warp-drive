---
url: /api/@warp-drive/core/request/type-aliases/ManagedRequestPriority.md
---

# &#x20;ManagedRequestPriority

```ts
type ManagedRequestPriority = object;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:50](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/request/-private/types.ts#L50)

Describes whether a managed (deduped) request should be treated as
blocking the caller's promise (e.g. a `fetch`) or as a non-blocking
background reload that other requests may dedupe against without
waiting on it.

## Properties

### blocking

```ts
blocking: boolean;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:52](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/request/-private/types.ts#L52)

Whether the request should gate the promise it is associated with.
