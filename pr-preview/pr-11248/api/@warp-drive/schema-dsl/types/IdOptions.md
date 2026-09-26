---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/schema-dsl/types/IdOptions.md
---

# &#x20;IdOptions

```ts
interface IdOptions {
  sourceKey?: string;
}
```

Defined in: [fields/id.ts:10](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/schema-dsl/src/fields/id.ts#L10)

Options accepted by the [id](../functions/id.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/id.ts:18](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/schema-dsl/src/fields/id.ts#L18)

The name of the identity field as returned by the API, if it differs
from the decorated property's name. Compiles onto the
[IdentityField](../../core/types/schema/fields/types/IdentityField.md)'s `sourceKey`.
