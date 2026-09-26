---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/reactive/types/PromiseState.md
description: >-
  The reactive pending, fulfilled, or rejected state of a promise, as returned
  by `getPromiseState`.
---

# &#x20;PromiseState\<T = `unknown`, E = `unknown`>

```ts
type PromiseState<T = unknown, E = unknown> = 
  | PendingPromise
  | ResolvedPromise<T>
| RejectedPromise<E>;
```

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:240](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/signals/promise-state.ts#L240)

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
