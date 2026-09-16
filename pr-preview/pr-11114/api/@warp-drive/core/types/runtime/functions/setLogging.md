---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/runtime/functions/setLogging.md
---

# &#x20;setLogging()

```ts
function setLogging(config): void;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:63](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/runtime.ts#L63)

Upserts the specified logging configuration into the runtime
config.

globalThis.setWarpDriveLogging({ LOG\_CACHE: true } });

## Parameters

### config

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<`LOG_CONFIG`>

## Returns

`void`
