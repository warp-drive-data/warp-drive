---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/array.md
---

# &#x20;array()

## Call Signature

```ts
function array(target, key): void;
```

Defined in: [fields/array.ts:60](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/schema-dsl/src/fields/array.ts#L60)

**`Decorator`**

Marks a property as an [ArrayField](../../core/types/schema/fields/interfaces/ArrayField.md) — an array of primitive
values. For arrays of well-defined objects, use [schemaArray](schemaArray.md).

### Parameters

#### target

`object`

#### key

`string`

### Returns

`void`

### Example

::: code-group

```ts [post.ts]
import { Resource, field, array } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @field declare title: string;
  @array declare tags: string[];
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "array", "name": "tags" }
]
```

:::

## Call Signature

```ts
function array(options): (target, key) => void;
```

Defined in: [fields/array.ts:61](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/schema-dsl/src/fields/array.ts#L61)

**`Decorator`**

Marks a property as an [ArrayField](../../core/types/schema/fields/interfaces/ArrayField.md) — an array of primitive
values. For arrays of well-defined objects, use [schemaArray](schemaArray.md).

### Parameters

#### options

[`ArrayFieldOptions`](../interfaces/ArrayFieldOptions.md)

### Returns

(`target`, `key`) => `void`

### Example

::: code-group

```ts [post.ts]
import { Resource, field, array } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @field declare title: string;
  @array declare tags: string[];
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "array", "name": "tags" }
]
```

:::
