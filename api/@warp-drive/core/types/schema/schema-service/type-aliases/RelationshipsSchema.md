---
url: >-
  /api/@warp-drive/core/types/schema/schema-service/type-aliases/RelationshipsSchema.md
---

# &#x20;RelationshipsSchema

```ts
type RelationshipsSchema = Record<string, LegacyRelationshipField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:37](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/schema/schema-service.ts#L37)

A dictionary of [LegacyRelationshipField](../../fields/type-aliases/LegacyRelationshipField.md) definitions keyed by
relationship name, as returned by the deprecated
[relationshipsDefinitionFor](../interfaces/SchemaService.md#relationshipsdefinitionfor) hook.
