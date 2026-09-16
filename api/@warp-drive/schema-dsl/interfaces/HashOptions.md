---
url: /api/@warp-drive/schema-dsl/interfaces/HashOptions.md
---

# &#x20;HashOptions

Defined in: [fields/hash.ts:11](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/schema-dsl/src/fields/hash.ts#L11)

Options accepted by the [hash](../functions/hash.md) decorator.

## Properties

### type

```ts
type: string;
```

Defined in: [fields/hash.ts:18](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/schema-dsl/src/fields/hash.ts#L18)

The name of a [HashFn](../../core/types/schema/concepts/type-aliases/HashFn.md) registered with the schema service, used
to compute this field's value from the object's cache data.
