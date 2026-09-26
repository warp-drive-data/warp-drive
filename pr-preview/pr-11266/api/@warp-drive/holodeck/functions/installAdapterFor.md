---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/holodeck/functions/installAdapterFor.md
description: >-
  Patches a legacy store so its adapters send `_fetchRequest` calls through the
  Holodeck mock server for the given test context.
---

# &#x20;installAdapterFor()

```ts
function installAdapterFor(owner: object, store: Store$1): void;
```

Defined in: [index.ts:426](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/packages/holodeck/src/index.ts#L426)

Creates an adapterFor function that wraps the provided adapterFor function
to override the adapter's \_fetchRequest method to route requests through
the Holodeck mock server.

## Parameters

### owner

`object`

The test context object used to retrieve the test ID.

### store

`Store$1`

## Returns

`void`
