---
url: /api/@warp-drive/core/reactive/functions/registerDerivations.md
---

# &#x20;registerDerivations()

```ts
function registerDerivations(schema): void;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/schema.ts:508](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/reactive/-private/schema.ts#L508)

Registers the default derivations for records that want
to use the PolarisMode defaults provided by

```ts
import { withDefaults } from '@warp-drive/schema-record';
```

## Parameters

### schema

[`SchemaService`](../../types/schema/schema-service/interfaces/SchemaService.md)

## Returns

`void`
