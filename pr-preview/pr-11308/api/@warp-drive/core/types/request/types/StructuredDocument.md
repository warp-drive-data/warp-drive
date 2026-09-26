---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/types/request/types/StructuredDocument.md
description: >-
  Union of the success and error documents that a request's `Future` resolves or
  rejects with.
---

# &#x20;StructuredDocument\<T>

```ts
type StructuredDocument<T> = 
  | StructuredDataDocument<T>
| StructuredErrorDocument<T>;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:566](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/types/request.ts#L566)

A union of the resolve/reject data types for the [Future](../../../request/types/Future.md)
returned by [request](../../../classes/Store.md#request)

See also the docs for:

* [Future](../../../request/types/Future.md)
* [StructuredDataDocument](StructuredDataDocument.md) (resolved/successful requests)
* [StructuredErrorDocument](StructuredErrorDocument.md) (rejected/failed requests)

## Type Parameters

### T

`T`
