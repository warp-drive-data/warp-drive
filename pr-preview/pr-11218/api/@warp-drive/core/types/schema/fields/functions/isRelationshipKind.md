---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/schema/fields/functions/isRelationshipKind.md
---

# &#x20;isRelationshipKind()

```ts
function isRelationshipKind(kind: string): kind is "resource" | "collection" | "belongsTo" | "hasMany";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2733](https://github.com/warp-drive-data/warp-drive/blob/03d13ed2a93f903df27b3865eaf37c1d6e48b34a/warp-drive-packages/core/src/types/schema/fields.ts#L2733)

Whether a field kind is any relationship kind, legacy or not.

## Parameters

### kind

`string`

## Returns

kind is "resource" | "collection" | "belongsTo" | "hasMany"
