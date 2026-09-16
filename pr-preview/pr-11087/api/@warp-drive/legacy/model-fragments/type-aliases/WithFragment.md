---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/model-fragments/type-aliases/WithFragment.md
---

&#x20;

# &#x20;WithFragment\<T>

```ts
type WithFragment<T> = T & WithEmberObject<T> & Fragment;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:9](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/legacy/src/model-fragments/index.ts#L9)

Adds the classic `EmberObject` API (via [WithEmberObject](../../compat/extensions/type-aliases/WithEmberObject.md)) and the
[Fragment](../classes/Fragment.md) API to the type of a migrated single-fragment resource.

## Type Parameters

### T

`T`
