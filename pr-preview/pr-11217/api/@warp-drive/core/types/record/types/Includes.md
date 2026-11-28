---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/types/record/types/Includes.md
description: >-
  Type utility giving the union of valid dot-separated `include` relationship
  paths for a typed record, excluding cycles.
---

# &#x20;Includes\<T *extends* [`TypedRecordInstance`](TypedRecordInstance.md), MAX_DEPTH *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`>

```ts
type Includes<T extends TypedRecordInstance, MAX_DEPTH extends _DEPTHCOUNT = DEFAULT_MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T, true>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:183](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/core/src/types/record.ts#L183)

A utility that provides the union type of all valid include paths for the given
TypedRecordInstance.

Cyclical paths are filtered out.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](TypedRecordInstance.md)

### MAX_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
