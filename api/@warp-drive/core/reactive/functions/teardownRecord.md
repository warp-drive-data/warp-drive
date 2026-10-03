---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/reactive/functions/teardownRecord.md
description: >-
  Default store `teardownRecord` hook that destroys a `ReactiveResource` when
  the store releases it.
---

# &#x20;teardownRecord()

```ts
function teardownRecord(record: unknown): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/hooks.ts:64](https://github.com/warp-drive-data/warp-drive/blob/61394c6234e8cd5b736138b64ac29fdf3ec888d2/warp-drive-packages/core/src/reactive/-private/hooks.ts#L64)

The store's default `teardownRecord` hook implementation, which asserts
that `record` is a [ReactiveResource](../types/ReactiveResource.md) and invokes its `Destroy`
behavior.

## Parameters

### record

`unknown`

## Returns

`void`
