---
url: /pr-preview/pr-11114/api/@warp-drive/schema-dsl/functions/belongsTo.md
---

# &#x20;belongsTo()&#x20;

```ts
function belongsTo(options): (target, key) => void;
```

Defined in: [fields/belongs-to.ts:98](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/schema-dsl/src/fields/belongs-to.ts#L98)

**`Decorator`**

> \[!CAUTION]
> This decorator is LEGACY, and only valid on resources decorated with
> `@Resource({ legacy: true })`.

Marks a property as a [LegacyBelongsToField](../../core/types/schema/fields/interfaces/LegacyBelongsToField.md) for use with
`@warp-drive/legacy/model`.

## Parameters

### options

[`BelongsToOptions`](../interfaces/BelongsToOptions.md)

## Returns

(`target`, `key`) => `void`

## Example

::: code-group

```ts [comment.ts]
import { Resource, belongsTo } from '@warp-drive/schema-dsl';

@Resource({ legacy: true })
export class Comment {
  @belongsTo({ type: 'post', inverse: 'comments', async: true })
  declare post: unknown;
}
```

```json [compiled fields (excerpt)]
[
  {
    "kind": "belongsTo",
    "name": "post",
    "type": "post",
    "options": { "async": true, "inverse": "comments" }
  }
]
```

:::
