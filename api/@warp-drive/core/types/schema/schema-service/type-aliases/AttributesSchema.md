---
url: >-
  /api/@warp-drive/core/types/schema/schema-service/type-aliases/AttributesSchema.md
---

# &#x20;AttributesSchema

```ts
type AttributesSchema = Record<string, LegacyAttributeField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:28](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/schema-service.ts#L28)

A dictionary of [LegacyAttributeField](../../fields/interfaces/LegacyAttributeField.md) definitions keyed by
attribute name, as returned by the deprecated
[attributesDefinitionFor](../interfaces/SchemaService.md#attributesdefinitionfor) hook.
