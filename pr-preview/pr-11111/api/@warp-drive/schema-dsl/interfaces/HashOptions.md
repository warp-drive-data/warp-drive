---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/HashOptions.md
---

# &#x20;HashOptions

Defined in: [fields/hash.ts:11](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/hash.ts#L11)

Options accepted by the [hash](../functions/hash.md) decorator.

## Properties

### type

```ts
type: string;
```

Defined in: [fields/hash.ts:18](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/hash.ts#L18)

The name of a [HashFn](../../core/types/schema/concepts/type-aliases/HashFn.md) registered with the schema service, used
to compute this field's value from the object's cache data.
