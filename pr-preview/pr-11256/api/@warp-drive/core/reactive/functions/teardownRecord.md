---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/reactive/functions/teardownRecord.md
---

# &#x20;teardownRecord()

```ts
function teardownRecord(record: unknown): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/hooks.ts:60](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/core/src/reactive/-private/hooks.ts#L60)

The store's default `teardownRecord` hook implementation, which asserts
that `record` is a [ReactiveResource](../types/ReactiveResource.md) and invokes its `Destroy`
behavior.

## Parameters

### record

`unknown`

## Returns

`void`
