---
url: https://canary.warp-drive.io/api/@warp-drive/core/types/StoreRequestInput.md
description: >-
  The request object `store.request` accepts, either a full immutable request
  info or a looser form with plain `records` and `headers`.
---

# &#x20;StoreRequestInput\<RT = `unknown`>

```ts
type StoreRequestInput<RT = unknown> = 
  | ImmutableRequestInfo<RT>
| LooseStoreRequestInfo<RT>;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:50](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L50)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](request/types/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
