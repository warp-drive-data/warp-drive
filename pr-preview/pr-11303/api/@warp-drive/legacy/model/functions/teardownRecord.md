---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11303/api/@warp-drive/legacy/model/functions/teardownRecord.md
description: >-
  Legacy store hook that destroys a `Model` instance when the store releases its
  record.
---

&#x20;

# &#x20;teardownRecord()

```ts
function teardownRecord(record: Model): void;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:59](https://github.com/warp-drive-data/warp-drive/blob/6a0f52f3db568b4389b2d95a71d94f0ddfce2d26/warp-drive-packages/legacy/src/model/-private/hooks.ts#L59)

The `teardownRecord` hook implementation for use with `Model`. Pass this
to your store's `teardownRecord` method when configuring the store to
use `Model` for schema/record instantiation.

## Parameters

### record

[`Model`](../classes/Model.md)

## Returns

`void`
