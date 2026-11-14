---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_STORE_EXTENDS_EMBER_OBJECT.md
description: >-
  Deprecation flag controlling whether the Store extends `@ember/object`; set it
  to `false` to stop extending EmberObject.
---

# &#x20;DEPRECATE_STORE_EXTENDS_EMBER_OBJECT&#x20;

```ts
const DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: boolean;
```

Defined in: [warp-drive-packages/build-config/src/deprecations.ts:438](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/build-config/src/deprecations.ts#L438)

When the flag is `true` (default), the Store class will extend from `@ember/object`.
When the flag is `false` or `ember-source` is not present, the Store will not extend
from EmberObject.

## Until

6.0
