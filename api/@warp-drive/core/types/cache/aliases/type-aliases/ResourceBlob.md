---
url: /api/@warp-drive/core/types/cache/aliases/type-aliases/ResourceBlob.md
---

# &#x20;ResourceBlob

```ts
type ResourceBlob = unknown;
```

Defined in: [warp-drive-packages/core/src/types/cache/aliases.ts:20](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache/aliases.ts#L20)

The `ResourceBlob` is an opaque type that must satisfy two constraints.

1. it should be possible for the CacheKeyManager to be able to
   generate a [ResourceKey](../../../identifier/type-aliases/ResourceKey.md) for it, whether by default or due to
   configuration.
2. it should be in a format expected by the [Cache](../../interfaces/Cache.md). This format
   is [Cache](../../interfaces/Cache.md)-declared.

This opaqueness allows arbitrary storage of any serializable/transferable
state, including such things as `Buffer`s and `String`s.
