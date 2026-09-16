---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/createPaginationSubscription.md
---

# &#x20;createPaginationSubscription()&#x20;

```ts
function createPaginationSubscription<RT, E>(store, args): PaginationSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:409](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/signals/pagination-subscription.ts#L409)

Creates the [PaginationSubscription](../interfaces/PaginationSubscription.md) a `<Paginate />` component uses to
manage its request lifecycle and pagination state. Pass the result back into
the component via `@subscription` to manage the lifecycle externally.

```ts
const subscription = createPaginationSubscription(store, { request });

subscription.paginationState; // the per-component PaginationState
subscription[DISPOSE](); // tear down when the owning component unmounts
```

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### store

| [`Store`](../../../classes/Store.md)
| [`RequestManager`](../../../classes/RequestManager.md)

### args

`PaginationSubscriptionArgs`<`RT`, `E`>

## Returns

[`PaginationSubscription`](../interfaces/PaginationSubscription.md)<`RT`, `E`>
