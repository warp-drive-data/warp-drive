---
url: /api/@warp-drive/core/reactive/functions/commit.md
---

# &#x20;commit()

```ts
function commit(record): Promise<void>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:769](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/reactive/-private/record.ts#L769)

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
