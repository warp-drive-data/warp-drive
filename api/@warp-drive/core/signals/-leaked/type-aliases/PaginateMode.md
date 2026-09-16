---
url: /api/@warp-drive/core/signals/-leaked/type-aliases/PaginateMode.md
---

# &#x20;PaginateMode

```ts
type PaginateMode = "paged" | "infinite";
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:19](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/signals/pagination-state.ts#L19)

The two navigation surfaces a `<Paginate />` component can drive. Selecting
one (via the component's `@mode` arg) narrows the yielded state so the two
APIs cannot be mixed:

* `'paged'` — single-page view, see [PagedPaginationState](../interfaces/PagedPaginationState.md).
* `'infinite'` — accumulated view, see [InfinitePaginationState](../interfaces/InfinitePaginationState.md).
