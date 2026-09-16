---
url: /api/@warp-drive/legacy/model-fragments/functions/withLegacy.md
---

&#x20;

# &#x20;withLegacy()

```ts
function withLegacy(schema): ResourceSchema;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-legacy.ts:14](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/model-fragments/utilities/with-legacy.ts#L14)

Used as a helper to setup the relevant parts of a legacy resource schema
migrated from `Model`, applying the `ember-object` and `fragment` object
extensions and a default `@id` identity field.

## Parameters

### schema

[`WithPartial`](../../../core/types/utils/type-aliases/WithPartial.md)<[`LegacyResourceSchema`](../../../core/types/schema/fields/interfaces/LegacyResourceSchema.md), `"identity"` | `"legacy"`>

the partial legacy resource schema to complete

## Returns

[`ResourceSchema`](../../../core/types/schema/fields/type-aliases/ResourceSchema.md)

the completed resource schema
