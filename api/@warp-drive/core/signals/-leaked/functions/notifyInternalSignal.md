---
url: /api/@warp-drive/core/signals/-leaked/functions/notifyInternalSignal.md
---

# &#x20;notifyInternalSignal()

```ts
function notifyInternalSignal(signal: WarpDriveSignal | undefined): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:286](https://github.com/warp-drive-data/warp-drive/blob/fe160824603a0a8854d9d5efc41b9b23dc4e7b81/warp-drive-packages/core/src/signals/reactivity/internal.ts#L286)

Marks `signal` as stale and notifies its underlying framework/TC39
signal, scheduling any of its consumers for re-render/re-computation.

## Parameters

### signal

`WarpDriveSignal` | `undefined`

## Returns

`void`
