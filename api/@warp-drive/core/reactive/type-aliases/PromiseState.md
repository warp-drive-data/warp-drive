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

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:232](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/signals/promise-state.ts#L232)

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
