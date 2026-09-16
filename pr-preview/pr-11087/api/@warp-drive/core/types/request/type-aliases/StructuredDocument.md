---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/request/type-aliases/StructuredDocument.md
---

# &#x20;StructuredDocument\<T>

```ts
type StructuredDocument<T> = 
  | StructuredDataDocument<T>
| StructuredErrorDocument<T>;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:506](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/request.ts#L506)

A union of the resolve/reject data types for the [Future](../../../request/interfaces/Future.md)
returned by [request](../../../classes/Store.md#request)

See also the docs for:

* [Future](../../../request/interfaces/Future.md)
* [StructuredDataDocument](../interfaces/StructuredDataDocument.md) (resolved/successful requests)
* [StructuredErrorDocument](../interfaces/StructuredErrorDocument.md) (rejected/failed requests)

## Type Parameters

### T

`T`
