---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/HashOptions.md
---

# &#x20;HashOptions

Defined in: [fields/hash.ts:11](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/hash.ts#L11)

Options accepted by the [hash](../functions/hash.md) decorator.

## Properties

### type

```ts
type: string;
```

Defined in: [fields/hash.ts:18](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/hash.ts#L18)

The name of a [HashFn](../../core/types/schema/concepts/type-aliases/HashFn.md) registered with the schema service, used
to compute this field's value from the object's cache data.
