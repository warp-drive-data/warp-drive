---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/functions/setIdentifierResetMethod.md
---

# &#x20;setIdentifierResetMethod()

```ts
function setIdentifierResetMethod(method): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:272](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L272)

Configure a callback for when the identifier cache is being torn down.

This configuration MUST occur prior to the store instance being created.

```js
import { setIdentifierResetMethod } from '@warp-drive/core';
```

Takes a method which can expect to be called when the parent application is destroyed.

If you have properly used a WeakMap to encapsulate the state of your customization
to the application instance, you may not need to implement the `resetMethod`.

## Parameters

### method

`ResetMethod` | `null`

## Returns

`void`
