---
url: /api/@warp-drive/core/reactive/functions/commit.md
---

# &#x20;commit()

```ts
function commit(record): Promise<void>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:769](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/reactive/-private/record.ts#L769)

Forcibly commit all local changes on an editable resource to
the remote (immutable) version.

This API should only be used cautiously. Typically a better
approach is for either the API or a Handler to reflect saved
changes back to update the cache.

## Parameters

### record

[`ReactiveResource`](../interfaces/ReactiveResource.md)

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
