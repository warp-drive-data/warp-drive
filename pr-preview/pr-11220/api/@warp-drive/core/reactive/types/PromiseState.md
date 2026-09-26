---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/reactive/types/PromiseState.md
---

# &#x20;PromiseState\<T = `unknown`, E = `unknown`>

```ts
type PromiseState<T = unknown, E = unknown> = 
  | PendingPromise
  | ResolvedPromise<T>
| RejectedPromise<E>;
```

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:232](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/signals/promise-state.ts#L232)

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
