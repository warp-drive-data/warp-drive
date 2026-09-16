---
url: /pr-preview/pr-11111/api/@warp-drive/legacy/model/functions/buildSchema.md
---

&#x20;

# &#x20;buildSchema()

```ts
function buildSchema(store): SchemaService;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/schema-provider.ts:274](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/legacy/src/model/-private/schema-provider.ts#L274)

The `createSchemaService` implementation for use with `Model`. Pass
the result of this to your store's `createSchemaService` method when
configuring the store to use `Model` for schema information.

## Parameters

### store

`Store$1`

## Returns

`SchemaService`
