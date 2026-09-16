---
url: /api/@warp-drive/holodeck/functions/installAdapterFor.md
---

# &#x20;installAdapterFor()

```ts
function installAdapterFor(owner, store): void;
```

Defined in: [index.ts:312](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/packages/holodeck/src/index.ts#L312)

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
