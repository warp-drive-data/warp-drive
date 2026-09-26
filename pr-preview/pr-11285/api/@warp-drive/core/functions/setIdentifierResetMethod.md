---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/core/functions/setIdentifierResetMethod.md
---

# &#x20;setIdentifierResetMethod()

```ts
function setIdentifierResetMethod(method: ResetMethod | null): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:335](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L335)

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
