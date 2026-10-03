---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/record/types/ExtractSuggestedCacheTypes.md
---

# &#x20;ExtractSuggestedCacheTypes\<T *extends* [`TypedRecordInstance`](TypedRecordInstance.md), MAX\_DEPTH *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`>

```ts
type ExtractSuggestedCacheTypes<T extends TypedRecordInstance, MAX_DEPTH extends _DEPTHCOUNT = DEFAULT_MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:157](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/core/src/types/record.ts#L157)

A utility that provides the union of all ResourceName for all potential
includes for the given TypedRecordInstance.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](TypedRecordInstance.md)

### MAX\_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
