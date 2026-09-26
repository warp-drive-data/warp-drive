---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/reactive/functions/registerDerivations.md
description: >-
  Registers the `@identity` and `@constructor` derivations that schemas built
  with `withDefaults` depend on.
---

# &#x20;registerDerivations()

```ts
function registerDerivations(schema: SchemaService): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:523](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/core/src/reactive/-private/schema.ts#L523)

Registers the default derivations for records that want
to use the PolarisMode defaults provided by

```ts
import { withDefaults } from '@warp-drive/schema-record';
```

## Parameters

### schema

[`SchemaService`](../../types/schema/schema-service/types/SchemaService.md)

## Returns

`void`
