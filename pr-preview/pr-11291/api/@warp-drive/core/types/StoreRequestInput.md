---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/StoreRequestInput.md
---

# &#x20;StoreRequestInput\<RT = `unknown`>

```ts
type StoreRequestInput<RT = unknown> = 
  | ImmutableRequestInfo<RT>
| LooseStoreRequestInfo<RT>;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:47](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L47)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](request/types/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
