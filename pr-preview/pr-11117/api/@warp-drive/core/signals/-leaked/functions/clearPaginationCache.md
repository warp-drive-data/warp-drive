---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/signals/-leaked/functions/clearPaginationCache.md
---

# &#x20;clearPaginationCache()&#x20;

```ts
function clearPaginationCache(): void;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-cache.ts:265](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/signals/pagination-cache.ts#L265)

Clears the module-level pagination cache used by [getPaginationCache](getPaginationCache.md).
Primarily intended for test isolation, since the cache is keyed by url and
otherwise persists for the lifetime of the module.

## Returns

`void`
