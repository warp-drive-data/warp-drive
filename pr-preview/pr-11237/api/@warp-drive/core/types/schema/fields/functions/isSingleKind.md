---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11237/api/@warp-drive/core/types/schema/fields/functions/isSingleKind.md
---

# &#x20;isSingleKind()

```ts
function isSingleKind(kind: string): kind is "resource" | "belongsTo";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2609](https://github.com/warp-drive-data/warp-drive/blob/4ed41983b0ec922ca6e9f5ca029ceb2c18903416/warp-drive-packages/core/src/types/schema/fields.ts#L2609)

Whether a field kind is a to-one relationship: the legacy `belongsTo` or the
`resource` kind.

## Parameters

### kind

`string`

## Returns

kind is "resource" | "belongsTo"
