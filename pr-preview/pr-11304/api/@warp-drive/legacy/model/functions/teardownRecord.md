---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/legacy/model/functions/teardownRecord.md
description: >-
  Legacy store hook that destroys a `Model` instance when the store releases its
  record.
---

&#x20;

# &#x20;teardownRecord()

```ts
function teardownRecord(record: Model): void;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:59](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/legacy/src/model/-private/hooks.ts#L59)

The `teardownRecord` hook implementation for use with `Model`. Pass this
to your store's `teardownRecord` method when configuring the store to
use `Model` for schema/record instantiation.

## Parameters

### record

[`Model`](../classes/Model.md)

## Returns

`void`
