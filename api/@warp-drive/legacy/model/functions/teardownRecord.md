---
url: /api/@warp-drive/legacy/model/functions/teardownRecord.md
---

&#x20;

# &#x20;teardownRecord()

```ts
function teardownRecord(record): void;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:56](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/model/-private/hooks.ts#L56)

The `teardownRecord` hook implementation for use with `Model`. Pass this
to your store's `teardownRecord` method when configuring the store to
use `Model` for schema/record instantiation.

## Parameters

### record

[`Model`](../classes/Model.md)

## Returns

`void`
