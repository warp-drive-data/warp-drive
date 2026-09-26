---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/functions/setIdentifierForgetMethod.md
---

# &#x20;setIdentifierForgetMethod()

```ts
function setIdentifierForgetMethod(method: ForgetMethod | null): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:315](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L315)

Configure a callback for when the identifier cache is going to release an identifier.

This configuration MUST occur prior to the store instance being created.

```js
import { setIdentifierForgetMethod } from '@warp-drive/core';
```

Takes method which can expect to receive an existing `Identifier` that should be eliminated
from any secondary lookup tables or caches that the user has populated for it.

## Parameters

### method

`ForgetMethod` | `null`

## Returns

`void`
