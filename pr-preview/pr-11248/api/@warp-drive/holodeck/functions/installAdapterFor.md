---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/holodeck/functions/installAdapterFor.md
---

# &#x20;installAdapterFor()

```ts
function installAdapterFor(owner: object, store: Store$1): void;
```

Defined in: [index.ts:413](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/packages/holodeck/src/index.ts#L413)

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
