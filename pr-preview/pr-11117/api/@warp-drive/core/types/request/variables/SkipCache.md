---
url: /pr-preview/pr-11117/api/@warp-drive/core/types/request/variables/SkipCache.md
---

# &#x20;SkipCache

```ts
const SkipCache: "___(unique) Symbol(SkipCache)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:27](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/types/request.ts#L27)

A [cacheOptions](../types/RequestInfo.md#cacheoptions) flag which, when set,
signals that a request should never be handled by the cache-manager and
thus will never resolve from cache nor update the cache.
