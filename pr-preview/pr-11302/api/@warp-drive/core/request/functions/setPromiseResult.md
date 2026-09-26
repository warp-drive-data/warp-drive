---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/request/functions/setPromiseResult.md
description: >-
  Records a promise's settled value or error so it can later be read
  synchronously with `getPromiseResult`.
---

# &#x20;setPromiseResult()

```ts
function setPromiseResult(promise: 
  | Awaitable<unknown, unknown>
  | Promise<unknown>, result: CacheResult): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:61](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/core/src/request/-private/promise-cache.ts#L61)

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
