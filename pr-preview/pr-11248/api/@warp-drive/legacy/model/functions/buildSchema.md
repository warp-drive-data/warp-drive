---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/legacy/model/functions/buildSchema.md
---

&#x20;

# &#x20;buildSchema()

```ts
function buildSchema(store: Store$1): SchemaService;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/schema-provider.ts:274](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/legacy/src/model/-private/schema-provider.ts#L274)

The `createSchemaService` implementation for use with `Model`. Pass
the result of this to your store's `createSchemaService` method when
configuring the store to use `Model` for schema information.

## Parameters

### store

`Store$1`

## Returns

`SchemaService`
