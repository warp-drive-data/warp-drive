---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/core/types/schema/fields/functions/isSingleKind.md
---

# &#x20;isSingleKind()

```ts
function isSingleKind(kind: string): kind is "resource" | "belongsTo";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2724](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/core/src/types/schema/fields.ts#L2724)

Whether a field kind is a to-one relationship: the legacy `belongsTo` or the
`resource` kind.

## Parameters

### kind

`string`

## Returns

kind is "resource" | "belongsTo"
