---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/core/types/schema/fields/functions/isManyKind.md
---

# &#x20;isManyKind()

```ts
function isManyKind(kind: string): kind is "collection" | "hasMany";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2714](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/core/src/types/schema/fields.ts#L2714)

Whether a field kind is a to-many relationship: the legacy `hasMany` or the
`collection` kind.

## Parameters

### kind

`string`

## Returns

kind is "collection" | "hasMany"
