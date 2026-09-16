---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/getOrCreateInternalSignal.md
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

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:232](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/signals/reactivity/internal.ts#L232)

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
