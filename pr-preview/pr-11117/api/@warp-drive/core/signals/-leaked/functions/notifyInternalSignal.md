---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/signals/-leaked/functions/notifyInternalSignal.md
---

# &#x20;notifyInternalSignal()

```ts
function notifyInternalSignal(signal: WarpDriveSignal | undefined): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:286](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/signals/reactivity/internal.ts#L286)

Marks `signal` as stale and notifies its underlying framework/TC39
signal, scheduling any of its consumers for re-render/re-computation.

## Parameters

### signal

`WarpDriveSignal` | `undefined`

## Returns

`void`
