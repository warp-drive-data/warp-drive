---
url: /api/@warp-drive/schema-dsl/functions/alias.md
---

# &#x20;alias()&#x20;

```ts
function alias(options): (target, key) => void;
```

Defined in: [fields/alias.ts:78](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/schema-dsl/src/fields/alias.ts#L78)

**`Decorator`**

Marks a property as an alias — compiling to a
[LegacyAliasField](../../core/types/schema/fields/interfaces/LegacyAliasField.md), [PolarisAliasField](../../core/types/schema/fields/interfaces/PolarisAliasField.md), or
[ObjectAliasField](../../core/types/schema/fields/interfaces/ObjectAliasField.md) depending on the schema it's declared on
— that points to another field already present in the schema.

Unlike [derived](derived.md), an alias may write back to its source field when
the record is in an editable mode.

## Parameters

### options

[`AliasOptions`](../interfaces/AliasOptions.md)

## Returns

(`target`, `key`) => `void`

## Example

::: code-group

```ts [product.ts]
import { Resource, field, alias } from '@warp-drive/schema-dsl';

@Resource
export class Product {
  @field({ sourceKey: 'product_name' }) declare name: string;
  @alias({ kind: 'field', name: 'name' }) declare productName: string;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "field", "name": "name", "sourceKey": "product_name" },
  { "kind": "alias", "name": "productName", "type": null, "options": { "kind": "field", "name": "name" } }
]
```

:::
