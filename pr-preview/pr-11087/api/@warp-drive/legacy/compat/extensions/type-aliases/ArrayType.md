---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/compat/extensions/type-aliases/ArrayType.md
---

&#x20;

# &#x20;ArrayType\<T>

```ts
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:376](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/legacy/src/compat/extensions.ts#L376)

Extracts the element type of an array type, or `never` if `T` is not an array.

## Type Parameters

### T

`T`
