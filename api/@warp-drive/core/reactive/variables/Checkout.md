---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/reactive/variables/Checkout.md
description: >-
  Deprecated symbol-keyed method on a ReactiveResource that resolves with an
  editable copy; use `checkout` instead.
---

# &#x20;~~Checkout~~&#x20;

```ts
const Checkout: "___(unique) Symbol(Checkout)";
```

Defined in: [warp-drive-packages/core/src/reactive/-private/symbols.ts:48](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/core/src/reactive/-private/symbols.ts#L48)

Symbol for the method used to request a mutable copy of an otherwise
immutable [ReactiveResource](../types/ReactiveResource.md).

## Deprecated

use the [checkout](../functions/checkout.md) utility function instead.
