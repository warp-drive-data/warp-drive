---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/legacy/compat/extensions/types/WithArrayLike.md
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

Defined in: [warp-drive-packages/legacy/src/compat/extensions.ts:410](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/legacy/src/compat/extensions.ts#L410)

Adds Ember's classic array-like API (as registered by [EmberArrayLikeExtension](../variables/EmberArrayLikeExtension.md))
to the type of a reactive array resource.

## Type Parameters

### T

`T`
