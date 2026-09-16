---
url: /api/@warp-drive/core/types/record/type-aliases/TypeFromInstanceOrString.md
---

# &#x20;TypeFromInstanceOrString\<T>

```ts
type TypeFromInstanceOrString<T> = T extends TypedRecordInstance ? T[typeof Type] : string;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:45](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/types/record.ts#L45)

A type utility that extracts the Type if available,
otherwise it returns string

## Type Parameters

### T

`T`
