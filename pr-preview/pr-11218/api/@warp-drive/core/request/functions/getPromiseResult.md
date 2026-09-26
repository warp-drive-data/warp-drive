---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/request/functions/getPromiseResult.md
---

# &#x20;getPromiseResult()

```ts
function getPromiseResult<T, E>(promise: 
  | Promise<T>
  | Awaitable<T, E>): CacheResult<T, E> | undefined;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:67](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/request/-private/promise-cache.ts#L67)

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
| [`Awaitable`](../types/Awaitable.md)<`T`, `E`>

## Returns

`CacheResult`<`T`, `E`> | `undefined`
