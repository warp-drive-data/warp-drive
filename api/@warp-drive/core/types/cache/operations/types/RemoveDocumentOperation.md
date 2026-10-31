---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/cache/operations/types/RemoveDocumentOperation.md
description: >-
  Cache operation passed to `cache.patch` that removes a request's document from
  the cache.
---

# &#x20;RemoveDocumentOperation

```ts
interface RemoveDocumentOperation extends Op {
  op: "remove";
  record: RequestKey;
}
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:72](https://github.com/warp-drive-data/warp-drive/blob/2f16d725c22fe7d7917b9d34ea75051fe1a33b70/warp-drive-packages/core/src/types/cache/operations.ts#L72)

Removes a document and its associated request from
the cache.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "remove";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:73](https://github.com/warp-drive-data/warp-drive/blob/2f16d725c22fe7d7917b9d34ea75051fe1a33b70/warp-drive-packages/core/src/types/cache/operations.ts#L73)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: RequestKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:77](https://github.com/warp-drive-data/warp-drive/blob/2f16d725c22fe7d7917b9d34ea75051fe1a33b70/warp-drive-packages/core/src/types/cache/operations.ts#L77)

The cache key for the request
