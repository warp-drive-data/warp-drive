---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/experiments/pagination/variables/defaultPageHints.md
---

&#x20;

# &#x20;defaultPageHints&#x20;

```ts
const defaultPageHints: PageHints;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:135](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L135)

The default [PageHints](../types/PageHints.md). Reads `currentPage`/`page` and `totalPages` from the
document `meta`, matching the behavior used before `pageHints` was configurable.
Used whenever the consumer does not provide a `pageHints` function.
