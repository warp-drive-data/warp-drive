---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/legacy/compat/utils/functions/configureTypeNormalization.md
---

&#x20;

# &#x20;configureTypeNormalization()

```ts
function configureTypeNormalization(fn): void;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:70](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/legacy/src/compat/utils.ts#L70)

Configure a function to be called to normalize
a resource type string. Used by both formattedType
and isEquivType to ensure consistent normalization
during comparison.

If validation fails or the type turns out be unnormalized
the configured mismatch reporter and assert functions will
be called.

## Parameters

### fn

(`type`) => `string`

a function which takes a string and returns a string

## Returns

`void`
