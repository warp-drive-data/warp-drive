---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/experiments/storage/functions/onStorageEvent.md
---

&#x20;

# &#x20;onStorageEvent()

```ts
function onStorageEvent(listener): () => void;
```

Defined in: [storage/storage.ts:128](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/experiments/src/storage/storage.ts#L128)

Subscribes to storage-change events, whether they originate from the
native Storage API (a `StorageEvent`, fired cross-tab) or from
[CacheStorage](../classes/CacheStorage.md)'s own same-tab notifications (dispatched as a
`CustomEvent` under the same 'storage' name — see `emitStorageEvent`
in `./cache.ts`).

Returns an unsubscribe function.

This can't be expressed by widening the global `WindowEventMap.storage`
type: that entry is inherited from `WindowEventHandlersEventMap` as
`StorageEvent`, and a declaration-merged override has to stay assignable
to the type it's overriding, not the other way around — deliberately
reusing this event name for a wider union has no way to satisfy that.

Route storage-event subscribers through this helper instead of calling
`window.addEventListener('storage', ...)` directly.

## Parameters

### listener

(`event`) => `void`

## Returns

() => `void`
