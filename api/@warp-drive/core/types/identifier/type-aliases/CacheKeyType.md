---
url: /api/@warp-drive/core/types/identifier/type-aliases/CacheKeyType.md
---

# &#x20;CacheKeyType

```ts
type CacheKeyType = "record" | "document";
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:32](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/identifier.ts#L32)

Identifies which "bucket" of the cache a key belongs to: resources
(`'record'`, see [ResourceKey](ResourceKey.md)) or request documents
(`'document'`, see [RequestKey](../interfaces/RequestKey.md)).
