---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/schema/schema-service/type-aliases/RelationshipsSchema.md
---

# &#x20;RelationshipsSchema

```ts
type RelationshipsSchema = Record<string, LegacyRelationshipField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:37](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/schema/schema-service.ts#L37)

A dictionary of [LegacyRelationshipField](../../fields/type-aliases/LegacyRelationshipField.md) definitions keyed by
relationship name, as returned by the deprecated
[relationshipsDefinitionFor](../interfaces/SchemaService.md#relationshipsdefinitionfor) hook.
