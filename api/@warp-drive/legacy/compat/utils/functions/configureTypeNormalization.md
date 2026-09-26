---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/utils/functions/configureTypeNormalization.md
description: >-
  Legacy migration helper that replaces the singularize-and-dasherize function
  `formattedType` and `isEquivType` use to normalize resource types.
---

&#x20;

# &#x20;configureTypeNormalization()

```ts
function configureTypeNormalization(fn: (type: string) => string): void;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:78](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/legacy/src/compat/utils.ts#L78)

Configure a function to be called to normalize
a resource type string. Used by both formattedType
and isEquivType to ensure consistent normalization
during comparison.

If validation fails or the type turns out be unnormalized
the configured mismatch reporter and assert functions will
be called.

## Parameters

### fn

(`type`: `string`) => `string`

a function which takes a string and returns a string

## Returns

`void`
