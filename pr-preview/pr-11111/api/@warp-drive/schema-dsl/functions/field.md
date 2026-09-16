---
url: /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/field.md
---

# &#x20;field()

## Call Signature

```ts
function field(target, key): void;
```

Defined in: [fields/field.ts:59](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/field.ts#L59)

**`Decorator`**

Marks a property as a [GenericField](../../core/types/schema/fields/interfaces/GenericField.md) — a plain field for
primitive values (strings, numbers, booleans) — on a
[Resource](Resource.md), [ObjectSchema](ObjectSchema.md), or [Trait](Trait-1.md).

### Parameters

#### target

`object`

#### key

`string`

### Returns

`void`

### Example

::: code-group

```ts [user.ts]
import { Resource, field } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare firstName: string;
  @field({ type: 'date-time', sourceKey: 'created_at' }) declare createdAt: string;
}
```

```json [compiled fields]
[
  { "kind": "field", "name": "firstName" },
  { "kind": "field", "name": "createdAt", "type": "date-time", "sourceKey": "created_at" }
]
```

:::

## Call Signature

```ts
function field(options): (target, key) => void;
```

Defined in: [fields/field.ts:60](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/field.ts#L60)

**`Decorator`**

Marks a property as a [GenericField](../../core/types/schema/fields/interfaces/GenericField.md) — a plain field for
primitive values (strings, numbers, booleans) — on a
[Resource](Resource.md), [ObjectSchema](ObjectSchema.md), or [Trait](Trait-1.md).

### Parameters

#### options

[`FieldOptions`](../interfaces/FieldOptions.md)

### Returns

(`target`, `key`) => `void`

### Example

::: code-group

```ts [user.ts]
import { Resource, field } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare firstName: string;
  @field({ type: 'date-time', sourceKey: 'created_at' }) declare createdAt: string;
}
```

```json [compiled fields]
[
  { "kind": "field", "name": "firstName" },
  { "kind": "field", "name": "createdAt", "type": "date-time", "sourceKey": "created_at" }
]
```

:::
