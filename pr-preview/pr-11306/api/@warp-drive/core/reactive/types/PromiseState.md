---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/core/reactive/types/PromiseState.md
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

Defined in: [warp-drive-packages/core/src/signals/promise-state.ts:240](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/core/src/signals/promise-state.ts#L240)

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
