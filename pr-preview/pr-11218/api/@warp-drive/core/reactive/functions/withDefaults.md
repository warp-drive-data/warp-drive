---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/reactive/functions/withDefaults.md
---

# &#x20;withDefaults()

```ts
function withDefaults(schema: WithPartial<PolarisResourceSchema, "identity">): PolarisResourceSchema;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:438](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/reactive/-private/schema.ts#L438)

Utility for constructing a ResourceSchema with the recommended
fields for the PolarisMode experience.

Using this requires registering the PolarisMode derivations

```ts
import { registerDerivations } from '@warp-drive/schema-record';

registerDerivations(schema);
```

## Parameters

### schema

[`WithPartial`](../../types/utils/types/WithPartial.md)<[`PolarisResourceSchema`](../../types/schema/fields/types/PolarisResourceSchema.md), `"identity"`>

## Returns

[`PolarisResourceSchema`](../../types/schema/fields/types/PolarisResourceSchema.md)
