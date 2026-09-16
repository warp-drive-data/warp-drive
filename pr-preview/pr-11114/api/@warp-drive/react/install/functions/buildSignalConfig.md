---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/react/install/functions/buildSignalConfig.md
---

# &#x20;buildSignalConfig()

```ts
function buildSignalConfig(options): SignalHooks;
```

Defined in: [install.ts:72](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/react/src/install.ts#L72)

Builds the [SignalHooks](../../../core/configure/interfaces/SignalHooks.md) implementation backed by the
[Signal Polyfill](https://github.com/proposal-signals/signal-polyfill),
used to wire WarpDrive's reactivity primitives into React.

## Parameters

### options

[`HooksOptions`](../../../core/configure/interfaces/HooksOptions.md)

## Returns

[`SignalHooks`](../../../core/configure/interfaces/SignalHooks.md)
