---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/record/types/TypeFromInstance.md
---

# &#x20;TypeFromInstance\<T>

```ts
type TypeFromInstance<T> = T extends TypedRecordInstance ? T[typeof Type] : never;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:38](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/record.ts#L38)

A type utility that extracts the Type if available,
otherwise it returns never.

## Type Parameters

### T

`T`
