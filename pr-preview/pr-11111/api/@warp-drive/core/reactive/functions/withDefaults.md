---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/reactive/functions/withDefaults.md
---

# &#x20;withDefaults()

```ts
function withDefaults(schema): PolarisResourceSchema;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:435](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/reactive/-private/schema.ts#L435)

Utility for constructing a ResourceSchema with the recommended
fields for the PolarisMode experience.

Using this requires registering the PolarisMode derivations

```ts
import { registerDerivations } from '@warp-drive/schema-record';

registerDerivations(schema);
```

## Parameters

### schema

[`WithPartial`](../../types/utils/type-aliases/WithPartial.md)<[`PolarisResourceSchema`](../../types/schema/fields/interfaces/PolarisResourceSchema.md), `"identity"`>

## Returns

[`PolarisResourceSchema`](../../types/schema/fields/interfaces/PolarisResourceSchema.md)
