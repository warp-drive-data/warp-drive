---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/cache/types/ChangedAttributesHash.md
description: >-
  Map of attribute name to `[oldValue, newValue]` for a resource's uncommitted
  attribute changes, as returned by `cache.changedAttrs`.
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:27](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/core/src/types/cache.ts#L27)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
