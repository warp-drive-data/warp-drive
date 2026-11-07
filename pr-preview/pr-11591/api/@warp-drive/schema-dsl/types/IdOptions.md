---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/schema-dsl/types/IdOptions.md
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

Defined in: [fields/id.ts:11](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/schema-dsl/src/fields/id.ts#L11)

Options accepted by the [id](../functions/id.md) decorator.

## Properties

### sourceKey?

```ts
sourceKey?: string;
```

Defined in: [fields/id.ts:19](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/schema-dsl/src/fields/id.ts#L19)

The name of the identity field as returned by the API, if it differs
from the decorated property's name. Compiles onto the
[IdentityField](../../core/types/schema/fields/types/IdentityField.md)'s `sourceKey`.
