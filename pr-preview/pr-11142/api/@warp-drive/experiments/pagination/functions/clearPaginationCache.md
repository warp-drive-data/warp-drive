---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/experiments/pagination/functions/clearPaginationCache.md
---

&#x20;

# &#x20;clearPaginationCache()&#x20;

```ts
function clearPaginationCache(): void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:199](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L199)

Clears the module-level pagination cache used by [getPaginationCache](getPaginationCache.md).
Primarily intended for test isolation, since the cache is keyed by url and
otherwise persists for the lifetime of the module.

## Returns

`void`
