---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/IdOptions.md
---

# &#x20;IdOptions

Defined in: [fields/id.ts:10](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/schema-dsl/src/fields/id.ts#L10)

Options accepted by the [id](../functions/id.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/id.ts:18](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/schema-dsl/src/fields/id.ts#L18)

The name of the identity field as returned by the API, if it differs
from the decorated property's name. Compiles onto the
[IdentityField](../../core/types/schema/fields/interfaces/IdentityField.md)'s `sourceKey`.
