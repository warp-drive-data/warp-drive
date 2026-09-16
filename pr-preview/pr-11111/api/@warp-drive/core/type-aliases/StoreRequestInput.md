---
url: /pr-preview/pr-11111/api/@warp-drive/core/type-aliases/StoreRequestInput.md
---

# &#x20;StoreRequestInput\<RT>

```ts
type StoreRequestInput<RT> = 
  | ImmutableRequestInfo<RT>
| LooseStoreRequestInfo<RT>;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:47](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L47)

The request shape accepted by [Store.request](../classes/Store.md#request), either a fully-formed
[ImmutableRequestInfo](../types/request/type-aliases/ImmutableRequestInfo.md) or the looser LooseStoreRequestInfo.

## Type Parameters

### RT

`RT` = `unknown`
