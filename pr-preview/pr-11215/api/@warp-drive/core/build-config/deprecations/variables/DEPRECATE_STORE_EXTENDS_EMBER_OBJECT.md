---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_STORE_EXTENDS_EMBER_OBJECT.md
description: >-
  Deprecation flag controlling whether the Store extends `@ember/object`; set it
  to `false` to stop extending EmberObject.
---

# &#x20;DEPRECATE_STORE_EXTENDS_EMBER_OBJECT&#x20;

```ts
const DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: boolean;
```

Defined in: [warp-drive-packages/build-config/src/deprecations.ts:438](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/build-config/src/deprecations.ts#L438)

When the flag is `true` (default), the Store class will extend from `@ember/object`.
When the flag is `false` or `ember-source` is not present, the Store will not extend
from EmberObject.

## Until

6.0
