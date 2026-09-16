---
url: /api/@warp-drive/core/request/functions/setPromiseResult.md
---

# &#x20;setPromiseResult()

```ts
function setPromiseResult(promise, result): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:57](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/request/-private/promise-cache.ts#L57)

Cache the settled result (or error) of a promise-like value so that its
outcome can be synchronously read later via [getPromiseResult](getPromiseResult.md),
without needing to await it again.

## Parameters

### promise

| [`Awaitable`](../type-aliases/Awaitable.md)<`unknown`, `unknown`>
| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`unknown`>

### result

`CacheResult`

## Returns

`void`
