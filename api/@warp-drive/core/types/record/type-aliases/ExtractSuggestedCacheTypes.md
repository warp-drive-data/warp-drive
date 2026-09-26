---
url: /api/@warp-drive/core/types/record/type-aliases/ExtractSuggestedCacheTypes.md
---

# &#x20;ExtractSuggestedCacheTypes\<T, MAX\_DEPTH>

```ts
type ExtractSuggestedCacheTypes<T, MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:157](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/record.ts#L157)

A utility that provides the union of all ResourceName for all potential
includes for the given TypedRecordInstance.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](../interfaces/TypedRecordInstance.md)

### MAX\_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
