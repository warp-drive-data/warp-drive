---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/types/identifier/types/CacheKeyType.md
---

# &#x20;CacheKeyType

```ts
type CacheKeyType = "record" | "document";
```

Defined in: [warp-drive-packages/core/src/types/identifier.ts:32](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/types/identifier.ts#L32)

Identifies which "bucket" of the cache a key belongs to: resources
(`'record'`, see [ResourceKey](ResourceKey.md)) or request documents
(`'document'`, see [RequestKey](RequestKey.md)).
