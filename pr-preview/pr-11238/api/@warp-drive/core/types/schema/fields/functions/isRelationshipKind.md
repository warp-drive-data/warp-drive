---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/schema/fields/functions/isRelationshipKind.md
---

# &#x20;isRelationshipKind()

```ts
function isRelationshipKind(kind: string): kind is "resource" | "collection" | "belongsTo" | "hasMany";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2618](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2618)

Whether a field kind is any relationship kind, legacy or not.

## Parameters

### kind

`string`

## Returns

kind is "resource" | "collection" | "belongsTo" | "hasMany"
