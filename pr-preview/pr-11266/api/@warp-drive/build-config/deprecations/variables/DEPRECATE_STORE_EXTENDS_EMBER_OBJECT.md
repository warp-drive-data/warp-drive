---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_STORE_EXTENDS_EMBER_OBJECT.md
---

# &#x20;DEPRECATE\_STORE\_EXTENDS\_EMBER\_OBJECT&#x20;

```ts
const DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: boolean = true;
```

Defined in: [deprecations.ts:420](https://github.com/warp-drive-data/warp-drive/blob/1a7c85f0c565d334929c0f2dd26023bb9bbcb6f7/warp-drive-packages/build-config/src/deprecations.ts#L420)

When the flag is `true` (default), the Store class will extend from `@ember/object`.
When the flag is `false` or `ember-source` is not present, the Store will not extend
from EmberObject.

## Until

6.0
