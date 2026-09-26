---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/legacy/model-fragments/types/WithFragment.md
description: >-
  Legacy type for a reactive object migrated from a `ModelFragments` fragment,
  adding the `EmberObject` and `Fragment` APIs to it.
---

&#x20;

# &#x20;WithFragment\<T>

```ts
type WithFragment<T> = T & WithEmberObject<T> & Fragment;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:12](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/legacy/src/model-fragments/index.ts#L12)

Adds the classic `EmberObject` API (via [WithEmberObject](../../compat/extensions/types/WithEmberObject.md)) and the
[Fragment](../classes/Fragment.md) API to the type of a migrated single-fragment resource.

## Type Parameters

### T

`T`
