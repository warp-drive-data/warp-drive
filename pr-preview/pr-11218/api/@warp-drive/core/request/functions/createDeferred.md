---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/request/functions/createDeferred.md
---

# &#x20;createDeferred()

```ts
function createDeferred<T>(): Deferred<T>;
```

Defined in: [warp-drive-packages/core/src/request/-private/future.ts:19](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/request/-private/future.ts#L19)

Create a [Deferred](../types/Deferred.md): a promise along with the `resolve`/`reject`
callbacks that settle it, so the promise can be handed out before the
work that will settle it has started.

## Type Parameters

### T

`T`

## Returns

[`Deferred`](../types/Deferred.md)<`T`>
