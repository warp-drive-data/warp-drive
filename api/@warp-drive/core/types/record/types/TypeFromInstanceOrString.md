---
url: /api/@warp-drive/core/types/record/types/TypeFromInstanceOrString.md
---

# &#x20;TypeFromInstanceOrString\<T>

```ts
type TypeFromInstanceOrString<T> = T extends TypedRecordInstance ? T[typeof Type] : string;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:45](https://github.com/warp-drive-data/warp-drive/blob/2147c43395d4507f6b19c72a4b94f1d81379737b/warp-drive-packages/core/src/types/record.ts#L45)

A type utility that extracts the Type if available,
otherwise it returns string

## Type Parameters

### T

`T`
