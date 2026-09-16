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

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:232](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/reactivity/internal.ts#L232)

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
