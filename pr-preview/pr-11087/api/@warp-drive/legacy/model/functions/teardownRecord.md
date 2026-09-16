---
url: /pr-preview/pr-11087/api/@warp-drive/legacy/model/functions/teardownRecord.md
---

&#x20;

# &#x20;teardownRecord()

```ts
function teardownRecord(record): void;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:56](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/legacy/src/model/-private/hooks.ts#L56)

The `teardownRecord` hook implementation for use with `Model`. Pass this
to your store's `teardownRecord` method when configuring the store to
use `Model` for schema/record instantiation.

## Parameters

### record

[`Model`](../classes/Model.md)

## Returns

`void`
