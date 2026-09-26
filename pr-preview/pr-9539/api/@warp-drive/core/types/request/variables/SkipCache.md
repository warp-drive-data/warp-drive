---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/request/variables/SkipCache.md
---

# &#x20;SkipCache

```ts
const SkipCache: "___(unique) Symbol(SkipCache)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:27](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/core/src/types/request.ts#L27)

A [cacheOptions](../types/RequestInfo.md#cacheoptions) flag which, when set,
signals that a request should never be handled by the cache-manager and
thus will never resolve from cache nor update the cache.
