---
url: /api/@warp-drive/legacy/compat/extensions/types/WithArrayLike.md
---

&#x20;

# &#x20;WithArrayLike\<T>

```ts
type WithArrayLike<T> = T extends infer U[] ? U & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & object : T[] & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & object;
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:387](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/legacy/src/compat/extensions.ts#L387)

Adds Ember's classic array-like API (as registered by [EmberArrayLikeExtension](../variables/EmberArrayLikeExtension.md))
to the type of a reactive array resource.

## Type Parameters

### T

`T`
