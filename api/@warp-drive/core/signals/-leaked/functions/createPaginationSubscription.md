---
url: >-
  /api/@warp-drive/core/signals/-leaked/functions/createPaginationSubscription.md
---

# &#x20;createPaginationSubscription()&#x20;

```ts
function createPaginationSubscription<RT, E>(store, args): PaginationSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:409](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/core/src/signals/pagination-subscription.ts#L409)

Creates the [PaginationSubscription](../types/PaginationSubscription.md) a `<Paginate />` component uses to
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

[`PaginationSubscription`](../types/PaginationSubscription.md)<`RT`, `E`>
