---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/legacy/model-fragments/types/WithFragmentArray.md
description: >-
  Legacy type for a reactive array migrated from a `ModelFragments` fragment
  array, adding Ember array methods and the `FragmentArray` API to it.
---

&#x20;

# &#x20;WithFragmentArray\<T *extends* [`Fragment`](../classes/Fragment.md)>

```ts
type WithFragmentArray<T extends Fragment> = T & WithArrayLike<T> & FragmentArray<T>;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:20](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/legacy/src/model-fragments/index.ts#L20)

Adds Ember's classic array-like API (via [WithArrayLike](../../compat/extensions/types/WithArrayLike.md)) and the
[FragmentArray](../classes/FragmentArray.md) API to the type of a migrated fragment-array resource.

## Type Parameters

### T

`T` *extends* [`Fragment`](../classes/Fragment.md)
