---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/schema/schema-service/types/AttributesSchema.md
description: >-
  Legacy attribute field definitions keyed by attribute name, returned by the
  deprecated `attributesDefinitionFor` schema hook.
---

# &#x20;AttributesSchema

```ts
type AttributesSchema = Record<string, LegacyAttributeField>;
```

Defined in: [warp-drive-packages/core/src/types/schema/schema-service.ts:36](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/core/src/types/schema/schema-service.ts#L36)

A dictionary of [LegacyAttributeField](../../fields/types/LegacyAttributeField.md) definitions keyed by
attribute name, as returned by the deprecated
[attributesDefinitionFor](SchemaService.md#attributesdefinitionfor) hook.
