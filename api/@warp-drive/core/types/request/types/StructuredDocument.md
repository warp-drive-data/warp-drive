---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/request/types/StructuredDocument.md
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

Defined in: [warp-drive-packages/core/src/types/request.ts:569](https://github.com/warp-drive-data/warp-drive/blob/2f16d725c22fe7d7917b9d34ea75051fe1a33b70/warp-drive-packages/core/src/types/request.ts#L569)

A union of the resolve/reject data types for the [Future](../../../request/types/Future.md)
returned by [request](../../../classes/Store.md#request)

The [Using The Response](/guides/the-manual/requests/using-the-response) guide shows
how to read one.

See also the docs for:

* [Future](../../../request/types/Future.md)
* [StructuredDataDocument](StructuredDataDocument.md) (resolved/successful requests)
* [StructuredErrorDocument](StructuredErrorDocument.md) (rejected/failed requests)

## Type Parameters

### T

`T`
