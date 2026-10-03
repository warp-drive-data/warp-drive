---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/cache/operations/types/RemoveDocumentOperation.md
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

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:72](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/core/src/types/cache/operations.ts#L72)

Removes a document and its associated request from
the cache.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "remove";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:73](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/core/src/types/cache/operations.ts#L73)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: RequestKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:77](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/core/src/types/cache/operations.ts#L77)

The cache key for the request
