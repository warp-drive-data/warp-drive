---
url: /pr-preview/pr-11114/api/@warp-drive/core/request/type-aliases/NextFn.md
---

# &#x20;NextFn\<P>

```ts
type NextFn<P> = (req) => Future<P>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:138](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/request/-private/types.ts#L138)

The `next` function passed to a [Handler](../interfaces/Handler.md) (or [CacheHandler](../interfaces/CacheHandler.md)),
used to forward a request to the next handler in the chain. Resolves to a
[Future](../interfaces/Future.md) carrying the downstream response.

## Type Parameters

### P

`P` = `unknown`

## Parameters

### req

[`RequestInfo`](../../types/request/interfaces/RequestInfo.md)

## Returns

[`Future`](../interfaces/Future.md)<`P`>
