---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/local.md
---

# &#x20;local()

## Call Signature

```ts
function local(target, key): void;
```

Defined in: [fields/local.ts:54](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/local.ts#L54)

**`Decorator`**

Marks a property as a [LocalField](../../core/types/schema/fields/interfaces/LocalField.md) — state that lives only on
the record instance, is never read from or written to the cache, and is
never sent to the server.

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
import { Resource, field, local } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare name: string;
  @local declare isEditing: boolean;
  @local({ defaultValue: 0 }) declare dirtyCount: number;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "@local", "name": "isEditing" },
  { "kind": "@local", "name": "dirtyCount", "options": { "defaultValue": 0 } }
]
```

:::

## Call Signature

```ts
function local(options): (target, key) => void;
```

Defined in: [fields/local.ts:55](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/local.ts#L55)

**`Decorator`**

Marks a property as a [LocalField](../../core/types/schema/fields/interfaces/LocalField.md) — state that lives only on
the record instance, is never read from or written to the cache, and is
never sent to the server.

### Parameters

#### options

[`LocalOptions`](../interfaces/LocalOptions.md)

### Returns

(`target`, `key`) => `void`

### Example

::: code-group

```ts [user.ts]
import { Resource, field, local } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare name: string;
  @local declare isEditing: boolean;
  @local({ defaultValue: 0 }) declare dirtyCount: number;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "@local", "name": "isEditing" },
  { "kind": "@local", "name": "dirtyCount", "options": { "defaultValue": 0 } }
]
```

:::
