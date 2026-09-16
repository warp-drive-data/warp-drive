---
url: /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/id.md
---

# &#x20;id()

## Call Signature

```ts
function id(target, key): void;
```

Defined in: [fields/id.ts:55](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/id.ts#L55)

**`Decorator`**

Marks a property as the [identity field](../../core/types/schema/fields/interfaces/IdentityField.md) for a
[Resource](Resource.md), overriding the default `{ kind: '@id', name: 'id' }`
identity with `{ kind: '@id', name: <decorated property> }`.

Only needed when a resource's primary key is not named `id`; most
resources can rely on [Resource](Resource.md)'s default identity instead.

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
import { Resource, id, field } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @id declare uuid: string;
  @field declare title: string;
}
```

```json [compiled schema (excerpt)]
{
  "type": "post",
  "identity": { "kind": "@id", "name": "uuid" }
}
```

:::

## Call Signature

```ts
function id(options): (target, key) => void;
```

Defined in: [fields/id.ts:56](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/id.ts#L56)

**`Decorator`**

Marks a property as the [identity field](../../core/types/schema/fields/interfaces/IdentityField.md) for a
[Resource](Resource.md), overriding the default `{ kind: '@id', name: 'id' }`
identity with `{ kind: '@id', name: <decorated property> }`.

Only needed when a resource's primary key is not named `id`; most
resources can rely on [Resource](Resource.md)'s default identity instead.

### Parameters

#### options

[`IdOptions`](../interfaces/IdOptions.md)

### Returns

(`target`, `key`) => `void`

### Example

::: code-group

```ts [post.ts]
import { Resource, id, field } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @id declare uuid: string;
  @field declare title: string;
}
```

```json [compiled schema (excerpt)]
{
  "type": "post",
  "identity": { "kind": "@id", "name": "uuid" }
}
```

:::
