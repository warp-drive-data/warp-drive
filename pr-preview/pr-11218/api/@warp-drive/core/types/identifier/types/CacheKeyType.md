---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/identifier/types/CacheKeyType.md
---

# &#x20;CacheKeyType

```ts
type CacheKeyType = "record" | "document";
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:32](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/identifier.ts#L32)

Identifies which "bucket" of the cache a key belongs to: resources
(`'record'`, see [ResourceKey](ResourceKey.md)) or request documents
(`'document'`, see [RequestKey](RequestKey.md)).
