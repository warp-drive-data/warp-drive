---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/configure/functions/setupSignals.md
description: >-
  Registers the signal hooks WarpDrive uses for reactivity, built by a callback
  that receives `HooksOptions`.
---

# &#x20;setupSignals()

```ts
function setupSignals<T>(buildConfig: (options: HooksOptions) => SignalHooks<T>): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:170](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/signals/reactivity/configure.ts#L170)

Configures the signals implementation to use. Supports multiple
implementations simultaneously.

See [HooksOptions](../types/HooksOptions.md) for the options passed to the provided function
when called.

See [SignalHooks](../types/SignalHooks.md) for the implementation the callback function should
return.

## Type Parameters

### T

`T`

## Parameters

### buildConfig

(`options`: [`HooksOptions`](../types/HooksOptions.md)) => [`SignalHooks`](../types/SignalHooks.md)<`T`>

a function that takes options and returns a configuration object

## Returns

`void`
