---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/reactive/type-aliases/PromiseState.md
---

# &#x20;PromiseState\<T, E>

```ts
type PromiseState<T, E> = 
  | PendingPromise
  | ResolvedPromise<T>
| RejectedPromise<E>;
```

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:232](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/signals/promise-state.ts#L232)

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
