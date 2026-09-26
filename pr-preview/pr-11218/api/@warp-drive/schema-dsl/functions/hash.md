---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/schema-dsl/functions/hash.md
---

# &#x20;hash()&#x20;

```ts
function hash(options: HashOptions): (target: object, key: string) => void;
```

Defined in: [fields/hash.ts:52](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/hash.ts#L52)

**`Decorator`**

Marks a property as the [HashField](../../core/types/schema/fields/types/HashField.md) used to compute the identity of
an [ObjectSchema](ObjectSchema.md). At most one property per object schema may use
this decorator, and doing so becomes that schema's `identity`.

## Parameters

### options

[`HashOptions`](../types/HashOptions.md)

## Returns

(`target`: `object`, `key`: `string`) => `void`

## Example

::: code-group

```ts [address.ts]
import { ObjectSchema, hash, field } from '@warp-drive/schema-dsl';

@ObjectSchema
export class Address {
  @hash({ type: 'address-hash' }) declare addressHash: string;
  @field declare street: string;
}
```

```json [compiled schema (excerpt)]
{
  "type": "address",
  "identity": { "kind": "@hash", "name": "addressHash", "type": "address-hash" }
}
```

:::
