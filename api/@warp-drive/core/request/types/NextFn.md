---
url: https://canary.warp-drive.io/api/@warp-drive/core/request/types/NextFn.md
description: >-
  The function a request handler calls to pass a request to the next handler in
  the chain, returning a `Future` for its response.
---

# &#x20;NextFn\<P = `unknown`>

```ts
type NextFn<P = unknown> = (req: RequestInfo) => Future<P>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:146](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/request/-private/types.ts#L146)

The `next` function passed to a [Handler](Handler.md) (or [CacheHandler](CacheHandler.md)),
used to forward a request to the next handler in the chain. Resolves to a
[Future](Future.md) carrying the downstream response.

## Type Parameters

### P

`P` = `unknown`

## Parameters

### req

[`RequestInfo`](../../types/request/types/RequestInfo.md)

## Returns

[`Future`](Future.md)<`P`>
