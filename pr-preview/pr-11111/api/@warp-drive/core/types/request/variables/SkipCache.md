---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/request/variables/SkipCache.md
---

# &#x20;SkipCache

```ts
const SkipCache: "___(unique) Symbol(SkipCache)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:27](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L27)

A [cacheOptions](../interfaces/RequestInfo.md#cacheoptions) flag which, when set,
signals that a request should never be handled by the cache-manager and
thus will never resolve from cache nor update the cache.
