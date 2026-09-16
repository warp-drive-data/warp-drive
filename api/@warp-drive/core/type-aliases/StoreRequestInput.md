---
url: /api/@warp-drive/core/type-aliases/StoreRequestInput.md
---

# &#x20;StoreRequestInput\<RT>

```ts
type StoreRequestInput<RT> = 
  | ImmutableRequestInfo<RT>
| LooseStoreRequestInfo<RT>;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:47](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L47)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](../types/request/type-aliases/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
