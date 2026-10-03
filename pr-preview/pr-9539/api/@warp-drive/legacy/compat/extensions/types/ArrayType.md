---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/legacy/compat/extensions/types/ArrayType.md
description: >-
  Type utility resolving to the element type of an array type, or `never` for
  non-arrays.
---

&#x20;

# &#x20;ArrayType\<T>

```ts
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:393](https://github.com/warp-drive-data/warp-drive/blob/6d8462857f57c6682cc698dbfcf9b3ece5d8bfd2/warp-drive-packages/legacy/src/compat/extensions.ts#L393)

Extracts the element type of an array type, or `never` if `T` is not an array.

## Type Parameters

### T

`T`
