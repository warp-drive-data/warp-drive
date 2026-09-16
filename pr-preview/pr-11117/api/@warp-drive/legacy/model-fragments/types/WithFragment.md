---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/legacy/model-fragments/types/WithFragment.md
---

&#x20;

# &#x20;WithFragment\<T>

```ts
type WithFragment<T> = T & WithEmberObject<T> & Fragment;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:9](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/legacy/src/model-fragments/index.ts#L9)

Adds the classic `EmberObject` API (via [WithEmberObject](../../compat/extensions/types/WithEmberObject.md)) and the
[Fragment](../classes/Fragment.md) API to the type of a migrated single-fragment resource.

## Type Parameters

### T

`T`
