---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/extensions/types/WithArrayLike.md
description: >-
  Legacy type that adds Ember array methods such as `mapBy` and `firstObject` to
  a reactive array type using `EmberArrayLikeExtension`.
---

&#x20;

# &#x20;WithArrayLike\<T>

```ts
type WithArrayLike<T> = T extends infer U[] ? U & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & {
  firstObject: T | undefined;
  lastObject: T | undefined;
} : T[] & Omit<typeof EmberArrayLikeFeatures, "firstObject" | "lastObject"> & {
  firstObject: T | undefined;
  lastObject: T | undefined;
};
```

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:410](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/legacy/src/compat/extensions.ts#L410)

Adds Ember's classic array-like API (as registered by [EmberArrayLikeExtension](../variables/EmberArrayLikeExtension.md))
to the type of a reactive array resource.

## Type Parameters

### T

`T`
