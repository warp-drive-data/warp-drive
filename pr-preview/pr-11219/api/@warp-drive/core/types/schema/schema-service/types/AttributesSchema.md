---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/types/schema/schema-service/types/AttributesSchema.md
---

# &#x20;AttributesSchema

```ts
type AttributesSchema = Record<string, LegacyAttributeField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:28](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/types/schema/schema-service.ts#L28)

A dictionary of [LegacyAttributeField](../../fields/types/LegacyAttributeField.md) definitions keyed by
attribute name, as returned by the deprecated
[attributesDefinitionFor](SchemaService.md#attributesdefinitionfor) hook.
