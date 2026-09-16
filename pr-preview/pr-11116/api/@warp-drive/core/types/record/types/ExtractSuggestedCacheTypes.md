---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/types/record/types/ExtractSuggestedCacheTypes.md
---

# &#x20;ExtractSuggestedCacheTypes\<T, MAX\_DEPTH>

```ts
type ExtractSuggestedCacheTypes<T, MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:157](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/types/record.ts#L157)

A utility that provides the union of all ResourceName for all potential
includes for the given TypedRecordInstance.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](TypedRecordInstance.md)

### MAX\_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
