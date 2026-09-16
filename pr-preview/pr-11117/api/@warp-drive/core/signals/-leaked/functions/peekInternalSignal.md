---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/signals/-leaked/functions/peekInternalSignal.md
---

# &#x20;peekInternalSignal()

```ts
function peekInternalSignal(signals: SignalStore | undefined, key: string | symbol): WarpDriveSignal | undefined;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/internal.ts:270](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/signals/reactivity/internal.ts#L270)

Looks up the WarpDriveSignal stored for `key` in `signals`,
if one has already been created, without creating or consuming it.

## Parameters

### signals

[`SignalStore`](../types/SignalStore.md) | `undefined`

### key

`string` | `symbol`

## Returns

`WarpDriveSignal` | `undefined`
