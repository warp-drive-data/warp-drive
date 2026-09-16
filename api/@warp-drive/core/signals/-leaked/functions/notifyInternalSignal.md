---
url: /api/@warp-drive/core/signals/-leaked/functions/notifyInternalSignal.md
---

# &#x20;notifyInternalSignal()

```ts
function notifyInternalSignal(signal): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:286](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/signals/reactivity/internal.ts#L286)

Marks `signal` as stale and notifies its underlying framework/TC39
signal, scheduling any of its consumers for re-render/re-computation.

## Parameters

### signal

`WarpDriveSignal` | `undefined`

## Returns

`void`
