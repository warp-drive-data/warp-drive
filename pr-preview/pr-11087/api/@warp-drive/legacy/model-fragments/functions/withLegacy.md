---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/model-fragments/functions/withLegacy.md
---

&#x20;

# &#x20;withLegacy()

```ts
function withLegacy(schema): ResourceSchema;
```

Defined in: [warp-drive-packages/legacy/src/model-fragments/utilities/with-legacy.ts:14](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/legacy/src/model-fragments/utilities/with-legacy.ts#L14)

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
