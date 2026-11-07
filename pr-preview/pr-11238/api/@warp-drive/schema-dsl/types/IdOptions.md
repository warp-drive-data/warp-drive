---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/schema-dsl/types/IdOptions.md
description: >-
  Options for the `@id` decorator that set the compiled identity field's
  `sourceKey`.
---

# &#x20;IdOptions

```ts
interface IdOptions {
  sourceKey?: string;
}
```

Defined in: [fields/id.ts:11](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/schema-dsl/src/fields/id.ts#L11)

Options accepted by the [id](../functions/id.md) decorator.

## Properties

### sourceKey?

```ts
sourceKey?: string;
```

Defined in: [fields/id.ts:19](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/schema-dsl/src/fields/id.ts#L19)

The name of the identity field as returned by the API, if it differs
from the decorated property's name. Compiles onto the
[IdentityField](../../core/types/schema/fields/types/IdentityField.md)'s `sourceKey`.
