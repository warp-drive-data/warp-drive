---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/reactive/functions/withDefaults.md
---

# &#x20;withDefaults()

```ts
function withDefaults(schema: WithPartial<PolarisResourceSchema, "identity">): PolarisResourceSchema;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:438](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/reactive/-private/schema.ts#L438)

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
