---
url: /api/@warp-drive/core/request/functions/setPromiseResult.md
---

# &#x20;setPromiseResult()

```ts
function setPromiseResult(promise: 
  | Awaitable<unknown, unknown>
  | Promise<unknown>, result: CacheResult): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:57](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/core/src/request/-private/promise-cache.ts#L57)

Cache the settled result (or error) of a promise-like value so that its
outcome can be synchronously read later via [getPromiseResult](getPromiseResult.md),
without needing to await it again.

## Parameters

### promise

| [`Awaitable`](../types/Awaitable.md)<`unknown`, `unknown`>
| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`unknown`>

### result

`CacheResult`

## Returns

`void`
