---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/legacy/model-fragments/types/WithFragmentArray.md
description: >-
  Legacy type for a reactive array migrated from a `ModelFragments` fragment
  array, adding Ember array methods and the `FragmentArray` API to it.
---

&#x20;

# &#x20;WithFragmentArray\<T *extends* [`Fragment`](../classes/Fragment.md)>

```ts
type WithFragmentArray<T extends Fragment> = T & WithArrayLike<T> & FragmentArray<T>;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:20](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/legacy/src/model-fragments/index.ts#L20)

Adds Ember's classic array-like API (via [WithArrayLike](../../compat/extensions/types/WithArrayLike.md)) and the
[FragmentArray](../classes/FragmentArray.md) API to the type of a migrated fragment-array resource.

## Type Parameters

### T

`T` *extends* [`Fragment`](../classes/Fragment.md)
