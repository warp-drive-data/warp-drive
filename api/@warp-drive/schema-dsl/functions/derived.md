---
url: /api/@warp-drive/schema-dsl/functions/derived.md
---

# &#x20;derived()&#x20;

```ts
function derived(options): (target, key) => void;
```

Defined in: [fields/derived.ts:61](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/schema-dsl/src/fields/derived.ts#L61)

**`Decorator`**

Marks a property as a [DerivedField](../../core/types/schema/fields/interfaces/DerivedField.md) — a computed, read-only
value derived from other fields. Derived fields are never stored in the
cache and are never sent to the server.

## Parameters

### options

[`DerivedOptions`](../interfaces/DerivedOptions.md)

## Returns

(`target`, `key`) => `void`

## Example

::: code-group

```ts [user.ts]
import { Resource, field, derived } from '@warp-drive/schema-dsl';

@Resource
export class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @derived({ type: '@concat' }) declare displayName: string;
}
```

```json [compiled fields (excerpt)]
[
  { "kind": "derived", "name": "displayName", "type": "@concat" }
]
```

:::
