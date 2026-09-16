---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/compat/extensions/type-aliases/WithArrayLike.md
---

&#x20;

# &#x20;WithArrayLike\<T>

```ts
type WithArrayLike<T> = T extends infer U[] ? U & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & object : T[] & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & object;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:387](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/legacy/src/compat/extensions.ts#L387)

Adds Ember's classic array-like API (as registered by [EmberArrayLikeExtension](../variables/EmberArrayLikeExtension.md))
to the type of a reactive array resource.

## Type Parameters

### T

`T`
