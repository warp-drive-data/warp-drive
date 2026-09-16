---
url: /pr-preview/pr-11087/api/@warp-drive/schema-dsl/functions/schemaArray.md
---

# &#x20;schemaArray()&#x20;

```ts
function schemaArray(options): (target, key) => void;
```

Defined in: [fields/schema-array.ts:132](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/schema-array.ts#L132)

**`Decorator`**

Marks a property as a [SchemaArrayField](../../core/types/schema/fields/interfaces/SchemaArrayField.md) — an array of
embedded objects whose shape is described by an [ObjectSchema](ObjectSchema.md).

This is not a relationship. `@hasMany` / `CollectionField` point at
other resources by identity. A schema-array stores the objects inline
on the parent; its elements have no identity of their own.

For an array of primitives with no schema, use [array](array.md) instead.

## Parameters

### options

[`SchemaArrayOptions`](../interfaces/SchemaArrayOptions.md)

## Returns

(`target`, `key`) => `void`

## Example

::: code-group

```ts [post.ts]
import { Resource, field, schemaArray } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @field declare title: string;
  @schemaArray({ type: 'address', key: '@index', defaultValue: true })
  declare locations: Address[];
}
```

```json [compiled fields (excerpt)]
[
  {
    "kind": "schema-array",
    "name": "locations",
    "type": "address",
    "options": { "key": "@index", "defaultValue": true }
  }
]
```

:::
