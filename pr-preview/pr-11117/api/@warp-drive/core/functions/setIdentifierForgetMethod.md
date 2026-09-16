---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/functions/setIdentifierForgetMethod.md
---

# &#x20;setIdentifierForgetMethod()

```ts
function setIdentifierForgetMethod(method: ForgetMethod | null): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:252](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L252)

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
