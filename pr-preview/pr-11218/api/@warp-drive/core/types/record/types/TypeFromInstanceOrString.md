---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/core/types/record/types/TypeFromInstanceOrString.md
---

# &#x20;TypeFromInstanceOrString\<T>

```ts
type TypeFromInstanceOrString<T> = T extends TypedRecordInstance ? T[typeof Type] : string;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:45](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/core/src/types/record.ts#L45)

A type utility that extracts the Type if available,
otherwise it returns string

## Type Parameters

### T

`T`
