---
url: /api/@warp-drive/core/signals/-leaked/types/PaginateMode.md
---

# &#x20;PaginateMode

```ts
type PaginateMode = "paged" | "infinite";
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:19](https://github.com/warp-drive-data/warp-drive/blob/2147c43395d4507f6b19c72a4b94f1d81379737b/warp-drive-packages/core/src/signals/pagination-state.ts#L19)

The two navigation surfaces a `<Paginate />` component can drive. Selecting
one (via the component's `@mode` arg) narrows the yielded state so the two
APIs cannot be mixed:

* `'paged'` — single-page view, see [PagedPaginationState](PagedPaginationState.md).
* `'infinite'` — accumulated view, see [InfinitePaginationState](InfinitePaginationState.md).
