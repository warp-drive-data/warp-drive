---
url: /api/@warp-drive/core/signals/-leaked/functions/getOrCreateInternalSignal.md
---

# &#x20;getOrCreateInternalSignal()

```ts
function getOrCreateInternalSignal(
   signals, 
   obj, 
   key, 
   initialValue
): WarpDriveSignal;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:232](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/signals/reactivity/internal.ts#L232)

## Parameters

### signals

[`SignalStore`](../type-aliases/SignalStore.md)

### obj

`object`

### key

`string` | `symbol`

### initialValue

`unknown`

## Returns

`WarpDriveSignal`
