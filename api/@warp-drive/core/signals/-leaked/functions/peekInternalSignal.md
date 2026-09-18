---
url: /api/@warp-drive/core/signals/-leaked/functions/peekInternalSignal.md
---

# &#x20;peekInternalSignal()

```ts
function peekInternalSignal(signals: SignalStore | undefined, key: string | symbol): WarpDriveSignal | undefined;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:270](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/core/src/signals/reactivity/internal.ts#L270)

Looks up the WarpDriveSignal stored for `key` in `signals`,
if one has already been created, without creating or consuming it.

## Parameters

### signals

[`SignalStore`](../types/SignalStore.md) | `undefined`

### key

`string` | `symbol`

## Returns

`WarpDriveSignal` | `undefined`
