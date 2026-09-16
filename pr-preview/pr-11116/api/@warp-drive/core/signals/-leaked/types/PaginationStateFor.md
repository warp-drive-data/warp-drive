---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/signals/-leaked/types/PaginationStateFor.md
---

# &#x20;PaginationStateFor\<RT, E, M>

```ts
type PaginationStateFor<RT, E, M> = M extends "infinite" ? InfinitePaginationState<RT, E> : PagedPaginationState<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:81](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L81)

Resolves a [PaginateMode](PaginateMode.md) to the surface it exposes, so a component
generic over the mode can yield only that surface.

## Type Parameters

### RT

`RT` = `unknown`

### E

`E` = `unknown`

### M

`M` *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`
