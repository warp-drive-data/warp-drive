---
url: /pr-preview/pr-11111/api/@warp-drive/core/configure/functions/setupSignals.md
---

# &#x20;setupSignals()

```ts
function setupSignals<T>(buildConfig): void;
```

Defined in: [warp-drive-packages/core/src/signals/reactivity/configure.ts:164](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/signals/reactivity/configure.ts#L164)

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
