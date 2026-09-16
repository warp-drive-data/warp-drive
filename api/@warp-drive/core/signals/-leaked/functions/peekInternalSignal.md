---
url: /api/@warp-drive/core/signals/-leaked/functions/peekInternalSignal.md
---

# &#x20;peekInternalSignal()

```ts
function peekInternalSignal(signals, key): WarpDriveSignal | undefined;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:270](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/signals/reactivity/internal.ts#L270)

Looks up the WarpDriveSignal stored for `key` in `signals`,
if one has already been created, without creating or consuming it.

## Parameters

### signals

[`SignalStore`](../type-aliases/SignalStore.md) | `undefined`

### key

`string` | `symbol`

## Returns

`WarpDriveSignal` | `undefined`
