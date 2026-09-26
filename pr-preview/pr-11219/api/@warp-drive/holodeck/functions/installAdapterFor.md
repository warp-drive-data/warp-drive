---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/holodeck/functions/installAdapterFor.md
---

# &#x20;installAdapterFor()

```ts
function installAdapterFor(owner: object, store: Store$1): void;
```

Defined in: [index.ts:413](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/packages/holodeck/src/index.ts#L413)

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
