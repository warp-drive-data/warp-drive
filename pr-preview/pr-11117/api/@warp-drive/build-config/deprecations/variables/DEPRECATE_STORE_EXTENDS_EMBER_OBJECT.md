---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_STORE_EXTENDS_EMBER_OBJECT.md
---

# &#x20;DEPRECATE\_STORE\_EXTENDS\_EMBER\_OBJECT&#x20;

```ts
const DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: boolean = true;
```

Defined in: [deprecations.ts:420](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/build-config/src/deprecations.ts#L420)

When the flag is `true` (default), the Store class will extend from `@ember/object`.
When the flag is `false` or `ember-source` is not present, the Store will not extend
from EmberObject.

## Until

6.0
