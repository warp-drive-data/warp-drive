---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/schema/schema-service/types/AttributesSchema.md
---

# &#x20;AttributesSchema

```ts
type AttributesSchema = Record<string, LegacyAttributeField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:28](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/core/src/types/schema/schema-service.ts#L28)

A dictionary of [LegacyAttributeField](../../fields/types/LegacyAttributeField.md) definitions keyed by
attribute name, as returned by the deprecated
[attributesDefinitionFor](SchemaService.md#attributesdefinitionfor) hook.
