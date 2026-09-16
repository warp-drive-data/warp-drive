---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/schema/schema-service/type-aliases/AttributesSchema.md
---

# &#x20;AttributesSchema

```ts
type AttributesSchema = Record<string, LegacyAttributeField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:28](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/schema/schema-service.ts#L28)

A dictionary of [LegacyAttributeField](../../fields/interfaces/LegacyAttributeField.md) definitions keyed by
attribute name, as returned by the deprecated
[attributesDefinitionFor](../interfaces/SchemaService.md#attributesdefinitionfor) hook.
