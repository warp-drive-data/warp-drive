---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/schema/schema-service/types/RelationshipsSchema.md
---

# &#x20;RelationshipsSchema

```ts
type RelationshipsSchema = Record<string, LegacyRelationshipField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:37](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/schema-service.ts#L37)

A dictionary of [LegacyRelationshipField](../../fields/types/LegacyRelationshipField.md) definitions keyed by
relationship name, as returned by the deprecated
[relationshipsDefinitionFor](SchemaService.md#relationshipsdefinitionfor) hook.
