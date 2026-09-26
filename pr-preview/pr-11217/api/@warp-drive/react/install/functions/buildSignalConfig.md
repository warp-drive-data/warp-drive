---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/react/install/functions/buildSignalConfig.md
---

# &#x20;buildSignalConfig()

```ts
function buildSignalConfig(options: HooksOptions): SignalHooks;
```

Defined in: [install.ts:72](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/react/src/install.ts#L72)

Builds the [SignalHooks](../../../core/configure/types/SignalHooks.md) implementation backed by the
[Signal Polyfill](https://github.com/proposal-signals/signal-polyfill),
used to wire WarpDrive's reactivity primitives into React.

## Parameters

### options

[`HooksOptions`](../../../core/configure/types/HooksOptions.md)

## Returns

[`SignalHooks`](../../../core/configure/types/SignalHooks.md)
