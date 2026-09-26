---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/types/identifier/types/RequestKey.md
description: >-
  Stable object with a unique `lid` that references a cached request document,
  letting that request's result be retrieved or replayed.
---

# &#x20;RequestKey

```ts
interface RequestKey {
  lid: string;
  type: "@document";
}
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:53](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/types/identifier.ts#L53)

A referentially stable object with a unique string (lid) that can be used
as a reference to request data in the cache.

Only requests that are assigned a RequestKey are retrievable/replayable from
the cache, though requests without RequestKeys may still update cache state.

## Properties

### lid

```ts
lid: string;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:57](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/types/identifier.ts#L57)

A string representing a unique identity.

***

### type

```ts
type: "@document";
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:61](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/types/identifier.ts#L61)

Discriminates a RequestKey from a [ResourceKey](ResourceKey.md).
