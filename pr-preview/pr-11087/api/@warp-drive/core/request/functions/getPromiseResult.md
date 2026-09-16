---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/request/functions/getPromiseResult.md
---

# &#x20;getPromiseResult()

```ts
function getPromiseResult<T, E>(promise): CacheResult<T, E> | undefined;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:67](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/request/-private/promise-cache.ts#L67)

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
