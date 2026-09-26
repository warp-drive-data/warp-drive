---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/experiments/pagination/functions/clearPaginationCache.md
description: >-
  Experimental: discards every shared pagination cache, mainly so tests start
  from a clean state.
---

&#x20;

# &#x20;clearPaginationCache()&#x20;

```ts
function clearPaginationCache(): void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:210](https://github.com/warp-drive-data/warp-drive/blob/fbc65452c713721d134e87c5af2e1a5a3a8a166b/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L210)

Clears the module-level pagination cache used by [getPaginationCache](getPaginationCache.md).
Primarily intended for test isolation, since the cache is keyed by url and
otherwise persists for the lifetime of the module.

## Returns

`void`
