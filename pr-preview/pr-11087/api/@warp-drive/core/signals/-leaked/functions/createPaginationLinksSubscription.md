---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/createPaginationLinksSubscription.md
---

# &#x20;createPaginationLinksSubscription()&#x20;

```ts
function createPaginationLinksSubscription<RT, E>(args): PaginationLinksSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-links-subscription.ts:81](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/signals/pagination-links-subscription.ts#L81)

Creates the [PaginationLinksSubscription](../interfaces/PaginationLinksSubscription.md) a links component (such as
`<EachLink />`) uses to derive its links from a [PagedPaginationState](../interfaces/PagedPaginationState.md).

```ts
const subscription = createPaginationLinksSubscription({ pages: paginationState });

subscription.paginationLinks; // the derived PaginationLinks
subscription[DISPOSE](); // tear down when the owning component unmounts
```

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### args

`PaginationLinksSubscriptionArgs`<`RT`, `E`>

## Returns

[`PaginationLinksSubscription`](../interfaces/PaginationLinksSubscription.md)<`RT`, `E`>
