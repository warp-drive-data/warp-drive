---
url: /api/@warp-drive/legacy/compat/extensions/types/ArrayType.md
---

&#x20;

# &#x20;ArrayType\<T>

```ts
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:376](https://github.com/warp-drive-data/warp-drive/blob/2147c43395d4507f6b19c72a4b94f1d81379737b/warp-drive-packages/legacy/src/compat/extensions.ts#L376)

Extracts the element type of an array type, or `never` if `T` is not an array.

## Type Parameters

### T

`T`
