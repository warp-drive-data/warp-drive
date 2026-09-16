---
url: /api/@warp-drive/core/configure/functions/setupSignals.md
---

# &#x20;setupSignals()

```ts
function setupSignals<T>(buildConfig): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:164](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/signals/reactivity/configure.ts#L164)

Configures the signals implementation to use. Supports multiple
implementations simultaneously.

See [HooksOptions](../interfaces/HooksOptions.md) for the options passed to the provided function
when called.

See [SignalHooks](../interfaces/SignalHooks.md) for the implementation the callback function should
return.

## Type Parameters

### T

`T`

## Parameters

### buildConfig

(`options`) => [`SignalHooks`](../interfaces/SignalHooks.md)<`T`>

a function that takes options and returns a configuration object

## Returns

`void`
