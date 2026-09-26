---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/reactive/functions/createRequestSubscription.md
---

# &#x20;createRequestSubscription()

```ts
function createRequestSubscription<RT, E>(store: 
  | Store
| RequestManager, args: SubscriptionArgs<RT, E>): RequestSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:826](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/signals/request-subscription.ts#L826)

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

[`SubscriptionArgs`](../types/SubscriptionArgs.md)<`RT`, `E`>

## Returns

[`RequestSubscription`](../types/RequestSubscription.md)<`RT`, `E`>
