---
url: /api/@warp-drive/legacy/model-fragments/type-aliases/WithFragment.md
---

&#x20;

# &#x20;WithFragment\<T>

```ts
type WithFragment<T> = T & WithEmberObject<T> & Fragment;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/index.ts:9](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/legacy/src/model-fragments/index.ts#L9)

Adds the classic `EmberObject` API (via [WithEmberObject](../../compat/extensions/type-aliases/WithEmberObject.md)) and the
[Fragment](../classes/Fragment.md) API to the type of a migrated single-fragment resource.

## Type Parameters

### T

`T`
