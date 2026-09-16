---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/object.md
---

# &#x20;object()

## Call Signature

```ts
function object(target, key): void;
```

Defined in: [fields/object.ts:62](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/object.ts#L62)

**`Decorator`**

Marks a property as an [ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md) — an object whose keys
point to primitive values with no well-defined shape. For objects with a
well-defined shape, use [schemaObject](schemaObject.md) with an
[ObjectSchema](ObjectSchema.md) instead.

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
import { Resource, field, object } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare name: string;
  @object declare metadata: Record<string, unknown>;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "object", "name": "metadata" }
]
```

:::

## Call Signature

```ts
function object(options): (target, key) => void;
```

Defined in: [fields/object.ts:63](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/object.ts#L63)

**`Decorator`**

Marks a property as an [ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md) — an object whose keys
point to primitive values with no well-defined shape. For objects with a
well-defined shape, use [schemaObject](schemaObject.md) with an
[ObjectSchema](ObjectSchema.md) instead.

### Parameters

#### options

[`ObjectFieldOptions`](../interfaces/ObjectFieldOptions.md)

### Returns

(`target`, `key`) => `void`

### Example

::: code-group

```ts [user.ts]
import { Resource, field, object } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare name: string;
  @object declare metadata: Record<string, unknown>;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "object", "name": "metadata" }
]
```

:::
