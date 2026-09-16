---
url: /api/@warp-drive/core/types/spec/document/type-aliases/ResourceDocument.md
---

# &#x20;ResourceDocument\<T>

```ts
type ResourceDocument<T> = 
  | ResourceMetaDocument
  | SingleResourceDataDocument<T>
  | CollectionResourceDataDocument<T>
  | ResourceErrorDocument;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:135](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/spec/document.ts#L135)

A type useful for representing the raw {json:api} documents that
the cache may use.

See also:

* [ResourceMetaDocument](../interfaces/ResourceMetaDocument.md)
* [SingleResourceDataDocument](../interfaces/SingleResourceDataDocument.md)
* [CollectionResourceDataDocument](../interfaces/CollectionResourceDataDocument.md)
* [ResourceErrorDocument](../interfaces/ResourceErrorDocument.md)

For the Reactive value returned by a request using the store, use [ReactiveDocument](../../../../reactive/type-aliases/ReactiveDocument.md) instead.

## Type Parameters

### T

`T` = [`PersistedResourceKey`](../../../identifier/interfaces/PersistedResourceKey.md)
