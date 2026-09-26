---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/experiments/pagination/types/PaginateMode.md
description: >-
  Experimental: the `@mode` value of `<Paginate />`, either `'paged'` for a
  single-page view or `'infinite'` for an accumulated view, which selects the
  yielded pagination API.
---

&#x20;

# &#x20;PaginateMode

```ts
type PaginateMode = "paged" | "infinite";
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:224](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L224)

The two navigation surfaces a `<Paginate />` component can drive. Selecting
one (via the component's `@mode` arg) narrows the yielded state so the two
APIs cannot be mixed:

* `'paged'` — single-page view, see [PagedPaginationState](PagedPaginationState.md).
* `'infinite'` — accumulated view, see [InfinitePaginationState](InfinitePaginationState.md).
