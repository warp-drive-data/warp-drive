---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/legacy/compat/extensions/types/ArrayType.md
---

&#x20;

# &#x20;ArrayType\<T>

```ts
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:376](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/legacy/src/compat/extensions.ts#L376)

Extracts the element type of an array type, or `never` if `T` is not an array.

## Type Parameters

### T

`T`
