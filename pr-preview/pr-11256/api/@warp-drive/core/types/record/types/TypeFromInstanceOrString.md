---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/record/types/TypeFromInstanceOrString.md
description: >-
  Type utility giving a record type's `[Type]` resource type string, or `string`
  if it declares none.
---

# &#x20;TypeFromInstanceOrString\<T>

```ts
type TypeFromInstanceOrString<T> = T extends TypedRecordInstance ? T[typeof Type] : string;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:55](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/core/src/types/record.ts#L55)

A type utility that extracts the Type if available,
otherwise it returns string

## Type Parameters

### T

`T`
