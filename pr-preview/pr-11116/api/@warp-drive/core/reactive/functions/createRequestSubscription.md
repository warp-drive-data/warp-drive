---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/reactive/functions/createRequestSubscription.md
---

# &#x20;createRequestSubscription()

```ts
function createRequestSubscription<RT, E>(store, args): RequestSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:826](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/request-subscription.ts#L826)

Creates a [RequestSubscription](../types/RequestSubscription.md), the reactive class powering the
`<Request />` component's autorefresh, retry, and refresh behaviors.

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### store

| [`Store`](../../classes/Store.md)
| [`RequestManager`](../../classes/RequestManager.md)

### args

[`SubscriptionArgs`](../../signals/-leaked/types/SubscriptionArgs.md)<`RT`, `E`>

## Returns

[`RequestSubscription`](../types/RequestSubscription.md)<`RT`, `E`>
