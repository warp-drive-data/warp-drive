---
url: /pr-preview/pr-11116/api/@warp-drive/schema-dsl/types/HashOptions.md
---

# &#x20;HashOptions

Defined in: [fields/hash.ts:11](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/schema-dsl/src/fields/hash.ts#L11)

Options accepted by the [hash](../functions/hash.md) decorator.

## Properties

### type

```ts
type: string;
```

Defined in: [fields/hash.ts:18](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/schema-dsl/src/fields/hash.ts#L18)

The name of a [HashFn](../../core/types/schema/concepts/types/HashFn.md) registered with the schema service, used
to compute this field's value from the object's cache data.
