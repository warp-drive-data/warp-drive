---
url: /api/@warp-drive/core/reactive/type-aliases/PromiseState.md
---

# &#x20;PromiseState\<T, E>

```ts
type PromiseState<T, E> = 
  | PendingPromise
  | ResolvedPromise<T>
| RejectedPromise<E>;
```

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:232](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/promise-state.ts#L232)

The state of a promise. This is the type that is returned
from `getPromiseState`.

See also:

* [PendingPromise](../interfaces/PendingPromise.md)
* [ResolvedPromise](../interfaces/ResolvedPromise.md)
* [RejectedPromise](../interfaces/RejectedPromise.md)

## Type Parameters

### T

`T` = `unknown`

### E

`E` = `unknown`
