---
url: /api/@warp-drive/core/request/type-aliases/NextFn.md
---

# &#x20;NextFn\<P>

```ts
type NextFn<P> = (req) => Future<P>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:138](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/request/-private/types.ts#L138)

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
