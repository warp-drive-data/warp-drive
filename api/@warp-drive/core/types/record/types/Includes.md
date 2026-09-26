---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/record/types/Includes.md
description: >-
  Type utility giving the union of valid dot-separated `include` relationship
  paths for a typed record, excluding cycles.
---

# &#x20;Includes\<T *extends* [`TypedRecordInstance`](TypedRecordInstance.md), MAX\_DEPTH *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`>

```ts
type Includes<T extends TypedRecordInstance, MAX_DEPTH extends _DEPTHCOUNT = DEFAULT_MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T, true>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:183](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/record.ts#L183)

A utility that provides the union type of all valid include paths for the given
TypedRecordInstance.

Cyclical paths are filtered out.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](TypedRecordInstance.md)

### MAX\_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
