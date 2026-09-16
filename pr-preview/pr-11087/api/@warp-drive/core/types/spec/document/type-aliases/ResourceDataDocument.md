---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/spec/document/type-aliases/ResourceDataDocument.md
---

# &#x20;ResourceDataDocument\<T>

```ts
type ResourceDataDocument<T> = 
  | SingleResourceDataDocument<T>
| CollectionResourceDataDocument<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:94](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/spec/document.ts#L94)

A type useful for representing the raw {json:api} documents that
the cache may use.

See also:

* [SingleResourceDataDocument](../interfaces/SingleResourceDataDocument.md)
* [CollectionResourceDataDocument](../interfaces/CollectionResourceDataDocument.md)

For the Reactive value returned by a request using the store, use [ReactiveDataDocument](../../../../reactive/type-aliases/ReactiveDataDocument.md) instead.

## Type Parameters

### T

`T` = [`PersistedResourceKey`](../../../identifier/interfaces/PersistedResourceKey.md)
