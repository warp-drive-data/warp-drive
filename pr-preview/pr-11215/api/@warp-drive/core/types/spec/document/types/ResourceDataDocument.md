---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/spec/document/types/ResourceDataDocument.md
---

# &#x20;ResourceDataDocument\<T = [`PersistedResourceKey`](../../../identifier/types/PersistedResourceKey.md)>

```ts
type ResourceDataDocument<T = PersistedResourceKey> = 
  | SingleResourceDataDocument<T>
| CollectionResourceDataDocument<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:94](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/document.ts#L94)

A type useful for representing the raw {json:api} documents that
the cache may use.

See also:

* [SingleResourceDataDocument](SingleResourceDataDocument.md)
* [CollectionResourceDataDocument](CollectionResourceDataDocument.md)

For the Reactive value returned by a request using the store, use [ReactiveDataDocument](../../../../reactive/types/ReactiveDataDocument.md) instead.

## Type Parameters

### T

`T` = [`PersistedResourceKey`](../../../identifier/types/PersistedResourceKey.md)
