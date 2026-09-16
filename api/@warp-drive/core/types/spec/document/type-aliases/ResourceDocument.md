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

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:135](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/spec/document.ts#L135)

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
