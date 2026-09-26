---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/request/functions/createDeferred.md
---

# &#x20;createDeferred()

```ts
function createDeferred<T>(): Deferred<T>;
```

Defined in: [warp-drive-packages/core/src/request/-private/future.ts:19](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/request/-private/future.ts#L19)

Create a [Deferred](../types/Deferred.md): a promise along with the `resolve`/`reject`
callbacks that settle it, so the promise can be handed out before the
work that will settle it has started.

## Type Parameters

### T

`T`

## Returns

[`Deferred`](../types/Deferred.md)<`T`>
