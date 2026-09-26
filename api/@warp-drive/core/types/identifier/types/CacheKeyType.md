---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/identifier/types/CacheKeyType.md
description: >-
  Which cache bucket a key belongs to: `'record'` for resource keys or
  `'document'` for request keys.
---

# &#x20;CacheKeyType

```ts
type CacheKeyType = "record" | "document";
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:40](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/core/src/types/identifier.ts#L40)

Identifies which "bucket" of the cache a key belongs to: resources
(`'record'`, see [ResourceKey](ResourceKey.md)) or request documents
(`'document'`, see [RequestKey](RequestKey.md)).
