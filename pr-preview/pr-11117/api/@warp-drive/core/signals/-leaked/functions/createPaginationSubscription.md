---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/signals/-leaked/functions/createPaginationSubscription.md
---

# &#x20;createPaginationSubscription()&#x20;

```ts
function createPaginationSubscription<RT, E>(store: 
  | Store
| RequestManager, args: PaginationSubscriptionArgs<RT, E>): PaginationSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:409](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/signals/pagination-subscription.ts#L409)

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
