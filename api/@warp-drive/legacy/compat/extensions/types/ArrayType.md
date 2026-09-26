---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/extensions/types/ArrayType.md
description: >-
  Type utility resolving to the element type of an array type, or `never` for
  non-arrays.
---

&#x20;

# &#x20;ArrayType\<T>

```ts
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:393](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/legacy/src/compat/extensions.ts#L393)

Extracts the element type of an array type, or `never` if `T` is not an array.

## Type Parameters

### T

`T`
