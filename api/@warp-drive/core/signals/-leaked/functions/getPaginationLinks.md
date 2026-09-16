---
url: /api/@warp-drive/core/signals/-leaked/functions/getPaginationLinks.md
---

# &#x20;getPaginationLinks()&#x20;

```ts
function getPaginationLinks<RT, E>(state): Readonly<PaginationLinks<RT, E>>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-links.ts:372](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/signals/pagination-links.ts#L372)

Get the [PaginationLinks](../interfaces/PaginationLinks.md) for a given [PaginationState](../interfaces/PaginationState.md). Returns
the same instance for the same state, so repeated calls (for example a
`<Paginate />` component and a separate links component reading the same state)
share one set of links. Keyed by state identity, the same way
[getPaginationState](getPaginationState.md) is keyed by request and getRequestState by
future.

```ts
const links = getPaginationLinks(paginationState);

for (const link of links.links) {
  if (link.isReal) {
    // render a numbered link, using link.setActive as the click handler
  } else {
    // render an ellipsis for the gap link.indexRange covers
  }
}
```

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### state

[`PagedPaginationState`](../interfaces/PagedPaginationState.md)<`RT`, `E`>

## Returns

[`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)<[`PaginationLinks`](../interfaces/PaginationLinks.md)<`RT`, `E`>>
