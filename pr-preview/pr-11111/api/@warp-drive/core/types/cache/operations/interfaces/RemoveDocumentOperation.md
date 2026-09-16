---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/cache/operations/interfaces/RemoveDocumentOperation.md
---

# &#x20;RemoveDocumentOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:63](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L63)

Removes a document and its associated request from
the cache.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "remove";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:64](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L64)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: RequestKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:68](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L68)

The cache key for the request
