---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_STORE_EXTENDS_EMBER_OBJECT.md
description: >-
  Deprecation flag controlling whether the Store extends `@ember/object`; set it
  to `false` to stop extending EmberObject.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;DEPRECATE\_STORE\_EXTENDS\_EMBER\_OBJECT&#x20;

```ts
const DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: boolean = true;
```

Defined in: [deprecations.ts:438](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/build-config/src/deprecations.ts#L438)

When the flag is `true` (default), the Store class will extend from `@ember/object`.
When the flag is `false` or `ember-source` is not present, the Store will not extend
from EmberObject.

## Until

6.0
