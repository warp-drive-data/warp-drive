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

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:94](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/spec/document.ts#L94)

A type useful for representing the raw {json:api} documents that
the cache may use.

See also:

* [SingleResourceDataDocument](../interfaces/SingleResourceDataDocument.md)
* [CollectionResourceDataDocument](../interfaces/CollectionResourceDataDocument.md)

For the Reactive value returned by a request using the store, use [ReactiveDataDocument](../../../../reactive/type-aliases/ReactiveDataDocument.md) instead.

## Type Parameters

### T

`T` = [`PersistedResourceKey`](../../../identifier/interfaces/PersistedResourceKey.md)
