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

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:232](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/signals/reactivity/internal.ts#L232)

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
