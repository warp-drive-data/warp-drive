---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/reactive/functions/withDefaults.md
description: >-
  Adds the default `id` identity plus `$key`, `$type`, and `constructor` derived
  fields to a PolarisMode resource schema.
---

# &#x20;withDefaults()

```ts
function withDefaults(schema: WithPartial<PolarisResourceSchema, "identity">): PolarisResourceSchema;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:446](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/reactive/-private/schema.ts#L446)

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
