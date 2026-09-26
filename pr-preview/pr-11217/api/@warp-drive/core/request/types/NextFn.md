---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/request/types/NextFn.md
---

# &#x20;NextFn\<P = `unknown`>

```ts
type NextFn<P = unknown> = (req: RequestInfo) => Future<P>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:138](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/request/-private/types.ts#L138)

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
