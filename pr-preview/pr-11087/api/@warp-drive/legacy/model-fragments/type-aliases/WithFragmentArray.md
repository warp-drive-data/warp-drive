---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/model-fragments/type-aliases/WithFragmentArray.md
---

&#x20;

# &#x20;WithFragmentArray\<T>

```ts
type WithFragmentArray<T> = T & WithArrayLike<T> & FragmentArray<T>;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:14](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/legacy/src/model-fragments/index.ts#L14)

Adds Ember's classic array-like API (via [WithArrayLike](../../compat/extensions/type-aliases/WithArrayLike.md)) and the
[FragmentArray](../classes/FragmentArray.md) API to the type of a migrated fragment-array resource.

## Type Parameters

### T

`T` *extends* [`Fragment`](../classes/Fragment.md)
