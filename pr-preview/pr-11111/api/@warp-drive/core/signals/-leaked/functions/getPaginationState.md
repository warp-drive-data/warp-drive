---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/functions/getPaginationState.md
---

# &#x20;getPaginationState()&#x20;

```ts
function getPaginationState<RT, E>(request, pageHints?): PaginationState<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:641](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/signals/pagination-state.ts#L641)

Get the [PaginationState](../interfaces/PaginationState.md) for a given request. Returns the same instance
for the same request future, so that repeated calls (e.g. in a template, or
alongside the `<Paginate />` component using the same request) share the same
local pagination state. Keyed by request identity, just like
getRequestState.

```ts
const future = store.request(query);
const pages = getPaginationState(future);

await future;
pages.totalPages; // now known, if the response exposed it
await pages.loadNext();
```

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### request

[`Future`](../../../request/interfaces/Future.md)<`RT`>

### pageHints?

[`PageHints`](../interfaces/PageHints.md)

## Returns

[`PaginationState`](../interfaces/PaginationState.md)<`RT`, `E`>
