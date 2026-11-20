---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/types/schema/fields/functions/isManyKind.md
---

# &#x20;isManyKind()

```ts
function isManyKind(kind: string): kind is "collection" | "hasMany";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2714](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/core/src/types/schema/fields.ts#L2714)

Whether a field kind is a to-many relationship: the legacy `hasMany` or the
`collection` kind.

## Parameters

### kind

`string`

## Returns

kind is "collection" | "hasMany"
