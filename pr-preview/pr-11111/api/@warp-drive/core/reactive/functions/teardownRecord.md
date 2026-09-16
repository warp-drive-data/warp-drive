---
url: /pr-preview/pr-11111/api/@warp-drive/core/reactive/functions/teardownRecord.md
---

# &#x20;teardownRecord()

```ts
function teardownRecord(record): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/hooks.ts:60](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/reactive/-private/hooks.ts#L60)

The store's default `teardownRecord` hook implementation, which asserts
that `record` is a [ReactiveResource](../interfaces/ReactiveResource.md) and invokes its `Destroy`
behavior.

## Parameters

### record

`unknown`

## Returns

`void`
