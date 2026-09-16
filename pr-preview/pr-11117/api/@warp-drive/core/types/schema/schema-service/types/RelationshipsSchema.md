---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/schema/schema-service/types/RelationshipsSchema.md
---

# &#x20;RelationshipsSchema

```ts
type RelationshipsSchema = Record<string, LegacyRelationshipField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:37](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/schema/schema-service.ts#L37)

A dictionary of [LegacyRelationshipField](../../fields/types/LegacyRelationshipField.md) definitions keyed by
relationship name, as returned by the deprecated
[relationshipsDefinitionFor](SchemaService.md#relationshipsdefinitionfor) hook.
