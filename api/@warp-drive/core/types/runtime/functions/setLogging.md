---
url: /api/@warp-drive/core/types/runtime/functions/setLogging.md
---

# &#x20;setLogging()

```ts
function setLogging(config): void;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:63](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/runtime.ts#L63)

Upserts the specified logging configuration into the runtime
config.

globalThis.setWarpDriveLogging({ LOG\_CACHE: true } });

## Parameters

### config

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<`LOG_CONFIG`>

## Returns

`void`
