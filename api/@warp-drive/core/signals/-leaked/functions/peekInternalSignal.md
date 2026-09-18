---
url: /api/@warp-drive/core/signals/-leaked/functions/peekInternalSignal.md
---

# &#x20;peekInternalSignal()

```ts
function peekInternalSignal(signals: SignalStore | undefined, key: string | symbol): WarpDriveSignal | undefined;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:270](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/core/src/signals/reactivity/internal.ts#L270)

Looks up the WarpDriveSignal stored for `key` in `signals`,
if one has already been created, without creating or consuming it.

## Parameters

### signals

[`SignalStore`](../types/SignalStore.md) | `undefined`

### key

`string` | `symbol`

## Returns

`WarpDriveSignal` | `undefined`
