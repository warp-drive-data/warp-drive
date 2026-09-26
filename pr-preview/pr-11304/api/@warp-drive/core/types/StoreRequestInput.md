---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/core/types/StoreRequestInput.md
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

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:50](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L50)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](request/types/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
