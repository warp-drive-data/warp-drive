---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/schema/schema-service/type-aliases/RelationshipsSchema.md
---

# &#x20;RelationshipsSchema

```ts
type RelationshipsSchema = Record<string, LegacyRelationshipField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:37](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/schema/schema-service.ts#L37)

A dictionary of [LegacyRelationshipField](../../fields/type-aliases/LegacyRelationshipField.md) definitions keyed by
relationship name, as returned by the deprecated
[relationshipsDefinitionFor](../interfaces/SchemaService.md#relationshipsdefinitionfor) hook.
