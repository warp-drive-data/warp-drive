---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/record/type-aliases/TypeFromInstance.md
---

# &#x20;TypeFromInstance\<T>

```ts
type TypeFromInstance<T> = T extends TypedRecordInstance ? T[typeof Type] : never;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:38](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/record.ts#L38)

A type utility that extracts the Type if available,
otherwise it returns never.

## Type Parameters

### T

`T`
