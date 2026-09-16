---
url: /pr-preview/pr-11087/api/@warp-drive/schema-dsl/interfaces/IdOptions.md
---

# &#x20;IdOptions

Defined in: [fields/id.ts:10](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/schema-dsl/src/fields/id.ts#L10)

Options accepted by the [id](../functions/id.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/id.ts:18](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/schema-dsl/src/fields/id.ts#L18)

The name of the identity field as returned by the API, if it differs
from the decorated property's name. Compiles onto the
[IdentityField](../../core/types/schema/fields/interfaces/IdentityField.md)'s `sourceKey`.
