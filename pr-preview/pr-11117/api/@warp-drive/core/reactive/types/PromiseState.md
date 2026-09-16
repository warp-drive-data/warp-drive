---
url: /pr-preview/pr-11117/api/@warp-drive/core/reactive/types/PromiseState.md
---

# &#x20;PromiseState\<T = `unknown`, E = `unknown`>

```ts
type PromiseState<T = unknown, E = unknown> = 
  | PendingPromise
  | ResolvedPromise<T>
| RejectedPromise<E>;
```

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:232](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/signals/promise-state.ts#L232)

The state of a promise. This is the type that is returned
from `getPromiseState`.

See also:

* [PendingPromise](PendingPromise.md)
* [ResolvedPromise](ResolvedPromise.md)
* [RejectedPromise](RejectedPromise.md)

## Type Parameters

### T

`T` = `unknown`

### E

`E` = `unknown`
