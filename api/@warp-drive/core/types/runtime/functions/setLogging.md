---
url: /api/@warp-drive/core/types/runtime/functions/setLogging.md
---

# &#x20;setLogging()

```ts
function setLogging(config: Partial<LOG_CONFIG>): void;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:63](https://github.com/warp-drive-data/warp-drive/blob/7afdd9818145634b9681a2bdd0f8c5cba16d9d9c/warp-drive-packages/core/src/types/runtime.ts#L63)

Upserts the specified logging configuration into the runtime
config.

globalThis.setWarpDriveLogging({ LOG\_CACHE: true } });

## Parameters

### config

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<`LOG_CONFIG`>

## Returns

`void`
