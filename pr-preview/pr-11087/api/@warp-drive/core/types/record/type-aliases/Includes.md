---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/record/type-aliases/Includes.md
---

# &#x20;Includes\<T, MAX\_DEPTH>

```ts
type Includes<T, MAX_DEPTH> = ExtractUnion<MAX_DEPTH, T, true>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:169](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/record.ts#L169)

A utility that provides the union type of all valid include paths for the given
TypedRecordInstance.

Cyclical paths are filtered out.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](../interfaces/TypedRecordInstance.md)

### MAX\_DEPTH

`MAX_DEPTH` *extends* `_DEPTHCOUNT` = `DEFAULT_MAX_DEPTH`
