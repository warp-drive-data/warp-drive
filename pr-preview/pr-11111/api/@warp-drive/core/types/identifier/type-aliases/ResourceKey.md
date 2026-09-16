---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/identifier/type-aliases/ResourceKey.md
---

# &#x20;ResourceKey\<T>

```ts
type ResourceKey<T> = 
  | PersistedResourceKey<T>
| NewResourceKey<T>;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:134](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/identifier.ts#L134)

A referentially stable object with a unique string (lid) that can be used
as a reference to data in the cache.

Every resource has a unique ResourceKey, and ResourceKeys may refer
to data that has never been loaded (for instance, in an async relationship).

## Type Parameters

### T

`T` *extends* `string` = `string`
