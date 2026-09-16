---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/model/migration-support/functions/withRestoredDeprecatedModelRequestBehaviors.md
---

&#x20;

# &#x20;withRestoredDeprecatedModelRequestBehaviors()

```ts
function withRestoredDeprecatedModelRequestBehaviors(schema): LegacyResourceSchema;
```

Defined in: [warp-drive-packages/legacy/src/model/migration-support.ts:391](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/legacy/src/model/migration-support.ts#L391)

Adds the necessasary fields to the schema for supporting
the deprecated request methods on LegacyMode schemas.

Use this instead of `withDefaults` to add the fields
and behaviors necessary to support Model-Like capabilities.

```ts
import { withRestoredDeprecatedModelRequestBehaviors } from '@warp-drive/legacy/model/migration-support';

export const UserSchema = withRestoredDeprecatedModelRequestBehaviors({
  type: 'user',
  fields: [
    { name: 'firstName', kind: 'attribute' },
    { name: 'lastName', kind: 'attribute' },
  ]
});
```

## Parameters

### schema

[`WithPartial`](../../../../core/types/utils/type-aliases/WithPartial.md)<[`LegacyResourceSchema`](../../../../core/types/schema/fields/interfaces/LegacyResourceSchema.md), `"identity"` | `"legacy"`>

## Returns

[`LegacyResourceSchema`](../../../../core/types/schema/fields/interfaces/LegacyResourceSchema.md)
