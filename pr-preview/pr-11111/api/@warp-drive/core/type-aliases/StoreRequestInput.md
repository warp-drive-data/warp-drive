---
url: /pr-preview/pr-11111/api/@warp-drive/core/type-aliases/StoreRequestInput.md
---

# &#x20;StoreRequestInput\<RT>

```ts
type StoreRequestInput<RT> = 
  | ImmutableRequestInfo<RT>
| LooseStoreRequestInfo<RT>;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:47](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L47)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](../types/request/type-aliases/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
