---
url: /api/@warp-drive/schema-dsl/functions/array.md
---

# &#x20;array()

## Call Signature

```ts
function array(target, key): void;
```

Defined in: [fields/array.ts:60](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/schema-dsl/src/fields/array.ts#L60)

**`Decorator`**

Marks a property as an [ArrayField](../../core/types/schema/fields/types/ArrayField.md) — an array of primitive
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

Defined in: [fields/array.ts:61](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/schema-dsl/src/fields/array.ts#L61)

**`Decorator`**

Marks a property as an [ArrayField](../../core/types/schema/fields/types/ArrayField.md) — an array of primitive
values. For arrays of well-defined objects, use [schemaArray](schemaArray.md).

### Parameters

#### options

[`ArrayFieldOptions`](../types/ArrayFieldOptions.md)

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
