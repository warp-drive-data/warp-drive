---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/request/type-aliases/StructuredDocument.md
---

# &#x20;StructuredDocument\<T>

```ts
type StructuredDocument<T> = 
  | StructuredDataDocument<T>
| StructuredErrorDocument<T>;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:506](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/request.ts#L506)

A union of the resolve/reject data types for the [Future](../../../request/interfaces/Future.md)
returned by [request](../../../classes/Store.md#request)

See also the docs for:

* [Future](../../../request/interfaces/Future.md)
* [StructuredDataDocument](../interfaces/StructuredDataDocument.md) (resolved/successful requests)
* [StructuredErrorDocument](../interfaces/StructuredErrorDocument.md) (rejected/failed requests)

## Type Parameters

### T

`T`
