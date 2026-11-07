---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/legacy/types/LegacyStoreSetupOptions.md
description: >-
  Options accepted by `useLegacyStore`, choosing via `linksMode` and
  `legacyRequests` how much of the legacy `Model`, adapter, and request support
  to enable.
---

&#x20;

# &#x20;LegacyStoreSetupOptions\<T *extends* `Cache` = `Cache`>

```ts
type LegacyStoreSetupOptions<T extends Cache = Cache> = 
  | LegacyModelStoreSetupOptions<T>
  | LegacyModelAndNetworkStoreSetupOptions<T>
| LegacyModelAndNetworkAndRequestStoreSetupOptions<T>;
```

Defined in: [warp-drive-packages/legacy/src/index.ts:165](https://github.com/warp-drive-data/warp-drive/blob/1045f539093e777fe19711f816806b8d4dc6b96f/warp-drive-packages/legacy/src/index.ts#L165)

The available options when setting up the legacy store,
one of:

* [LegacyModelStoreSetupOptions](LegacyModelStoreSetupOptions.md)
* [LegacyModelAndNetworkStoreSetupOptions](LegacyModelAndNetworkStoreSetupOptions.md)
* [LegacyModelAndNetworkAndRequestStoreSetupOptions](LegacyModelAndNetworkAndRequestStoreSetupOptions.md)

## Type Parameters

### T

`T` *extends* `Cache` = `Cache`
