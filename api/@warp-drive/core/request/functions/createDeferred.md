---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/request/functions/createDeferred.md
description: >-
  Creates a promise together with its `resolve` and `reject` callbacks so it can
  be handed out before it is settled.
---

# &#x20;createDeferred()

```ts
function createDeferred<T>(): Deferred<T>;
```

Defined in: [warp-drive-packages/core/src/request/-private/future.ts:21](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/core/src/request/-private/future.ts#L21)

Create a [Deferred](../types/Deferred.md): a promise along with the `resolve`/`reject`
callbacks that settle it, so the promise can be handed out before the
work that will settle it has started.

## Type Parameters

### T

`T`

## Returns

[`Deferred`](../types/Deferred.md)<`T`>
