---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/runtime/functions/setLogging.md
---

# &#x20;setLogging()

```ts
function setLogging(config): void;
```

Defined in: [warp-drive-packages/core/src/types/runtime.ts:63](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/runtime.ts#L63)

Upserts the specified logging configuration into the runtime
config.

globalThis.setWarpDriveLogging({ LOG\_CACHE: true } });

## Parameters

### config

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<`LOG_CONFIG`>

## Returns

`void`
