---
url: /api/@warp-drive/core/reactive/functions/teardownRecord.md
---

# &#x20;teardownRecord()

```ts
function teardownRecord(record): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/hooks.ts:60](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/reactive/-private/hooks.ts#L60)

The store's default `teardownRecord` hook implementation, which asserts
that `record` is a [ReactiveResource](../interfaces/ReactiveResource.md) and invokes its `Destroy`
behavior.

## Parameters

### record

`unknown`

## Returns

`void`
