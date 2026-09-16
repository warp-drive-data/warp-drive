---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/functions/peekInternalSignal.md
---

# &#x20;peekInternalSignal()

```ts
function peekInternalSignal(signals, key): WarpDriveSignal | undefined;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:270](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/signals/reactivity/internal.ts#L270)

Looks up the WarpDriveSignal stored for `key` in `signals`,
if one has already been created, without creating or consuming it.

## Parameters

### signals

[`SignalStore`](../type-aliases/SignalStore.md) | `undefined`

### key

`string` | `symbol`

## Returns

`WarpDriveSignal` | `undefined`
