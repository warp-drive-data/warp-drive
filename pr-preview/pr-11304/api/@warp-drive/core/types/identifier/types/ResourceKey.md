---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/core/types/identifier/types/ResourceKey.md
description: >-
  Stable object with a unique `lid` plus `type` and `id` that uniquely
  references one resource's data in the cache, loaded or not.
---

# &#x20;ResourceKey\<T *extends* `string` = `string`>

```ts
type ResourceKey<T extends string = string> = 
  | PersistedResourceKey<T>
| NewResourceKey<T>;
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:156](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/identifier.ts#L156)

A referentially stable object with a unique string (lid) that can be used
as a reference to data in the cache.

Every resource has a unique ResourceKey, and ResourceKeys may refer
to data that has never been loaded (for instance, in an async relationship).

## Type Parameters

### T

`T` *extends* `string` = `string`
