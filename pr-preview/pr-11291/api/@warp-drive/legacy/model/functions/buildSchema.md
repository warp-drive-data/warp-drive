---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/legacy/model/functions/buildSchema.md
---

&#x20;

# &#x20;buildSchema()

```ts
function buildSchema(store: Store$1): SchemaService;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/schema-provider.ts:274](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/legacy/src/model/-private/schema-provider.ts#L274)

The `createSchemaService` implementation for use with `Model`. Pass
the result of this to your store's `createSchemaService` method when
configuring the store to use `Model` for schema information.

## Parameters

### store

`Store$1`

## Returns

`SchemaService`
