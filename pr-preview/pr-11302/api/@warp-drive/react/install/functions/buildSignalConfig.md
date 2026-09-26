---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/react/install/functions/buildSignalConfig.md
description: >-
  Builds the signal hooks, backed by the Signal polyfill, that connect WarpDrive
  reactivity to React rendering and test waiters.
---

# &#x20;buildSignalConfig()

```ts
function buildSignalConfig(options: HooksOptions): SignalHooks;
```

Defined in: [install.ts:79](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/react/src/install.ts#L79)

Builds the [SignalHooks](../../../core/configure/types/SignalHooks.md) implementation backed by the
[Signal Polyfill](https://github.com/proposal-signals/signal-polyfill),
used to wire WarpDrive's reactivity primitives into React.

## Parameters

### options

[`HooksOptions`](../../../core/configure/types/HooksOptions.md)

## Returns

[`SignalHooks`](../../../core/configure/types/SignalHooks.md)
