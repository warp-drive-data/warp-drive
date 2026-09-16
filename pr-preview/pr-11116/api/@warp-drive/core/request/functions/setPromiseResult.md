---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/request/functions/setPromiseResult.md
---

# &#x20;setPromiseResult()

```ts
function setPromiseResult(promise, result): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:57](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/request/-private/promise-cache.ts#L57)

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
