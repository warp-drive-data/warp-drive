---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/request/functions/getPromiseResult.md
---

# &#x20;getPromiseResult()

```ts
function getPromiseResult<T, E>(promise): CacheResult<T, E> | undefined;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:67](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/request/-private/promise-cache.ts#L67)

Synchronously read the settled result (or error) previously recorded for
a promise-like value via [setPromiseResult](setPromiseResult.md), if any.

## Type Parameters

### T

`T`

### E

`E`

## Parameters

### promise

| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`T`>
| [`Awaitable`](../type-aliases/Awaitable.md)<`T`, `E`>

## Returns

`CacheResult`<`T`, `E`> | `undefined`
