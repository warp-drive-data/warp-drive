---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/cache/aliases/types/ResourceBlob.md
---

# &#x20;ResourceBlob

```ts
type ResourceBlob = unknown;
```

Defined in: [warp-drive-packages/core/src/types/cache/aliases.ts:20](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/cache/aliases.ts#L20)

The `ResourceBlob` is an opaque type that must satisfy two constraints.

1. it should be possible for the CacheKeyManager to be able to
   generate a [ResourceKey](../../../identifier/types/ResourceKey.md) for it, whether by default or due to
   configuration.
2. it should be in a format expected by the [Cache](../../types/Cache.md). This format
   is [Cache](../../types/Cache.md)-declared.

This opaqueness allows arbitrary storage of any serializable/transferable
state, including such things as `Buffer`s and `String`s.
