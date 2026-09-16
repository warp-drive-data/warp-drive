---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/reactive/functions/createRequestSubscription.md
---

# &#x20;createRequestSubscription()

```ts
function createRequestSubscription<RT, E>(store, args): RequestSubscription<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:826](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/signals/request-subscription.ts#L826)

Creates a [RequestSubscription](../interfaces/RequestSubscription.md), the reactive class powering the
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

[`SubscriptionArgs`](../../signals/-leaked/interfaces/SubscriptionArgs.md)<`RT`, `E`>

## Returns

[`RequestSubscription`](../interfaces/RequestSubscription.md)<`RT`, `E`>
