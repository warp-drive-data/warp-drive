---
url: /api/@warp-drive/legacy/type-aliases/LegacyStoreSetupOptions.md
---

&#x20;

# &#x20;LegacyStoreSetupOptions\<T>

```ts
type LegacyStoreSetupOptions<T> = 
  | LegacyModelStoreSetupOptions<T>
  | LegacyModelAndNetworkStoreSetupOptions<T>
| LegacyModelAndNetworkAndRequestStoreSetupOptions<T>;
```

Defined in: [warp-drive-packages/legacy/src/index.ts:154](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/legacy/src/index.ts#L154)

The available options when setting up the legacy store,
one of:

* [LegacyModelStoreSetupOptions](../interfaces/LegacyModelStoreSetupOptions.md)
* [LegacyModelAndNetworkStoreSetupOptions](../interfaces/LegacyModelAndNetworkStoreSetupOptions.md)
* [LegacyModelAndNetworkAndRequestStoreSetupOptions](../interfaces/LegacyModelAndNetworkAndRequestStoreSetupOptions.md)

## Type Parameters

### T

`T` *extends* `Cache` = `Cache`
