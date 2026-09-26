---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/core/reactive/functions/commit.md
---

# &#x20;commit()

```ts
function commit(record: ReactiveResource): Promise<void>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:797](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/reactive/-private/record.ts#L797)

Forcibly commit all local changes on an editable resource to
the remote (immutable) version.

This API should only be used cautiously. Typically a better
approach is for either the API or a Handler to reflect saved
changes back to update the cache.

## Parameters

### record

[`ReactiveResource`](../types/ReactiveResource.md)

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
