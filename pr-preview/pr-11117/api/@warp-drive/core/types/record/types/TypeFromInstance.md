---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/record/types/TypeFromInstance.md
---

# &#x20;TypeFromInstance\<T>

```ts
type TypeFromInstance<T> = T extends TypedRecordInstance ? T[typeof Type] : never;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:38](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/record.ts#L38)

A type utility that extracts the Type if available,
otherwise it returns never.

## Type Parameters

### T

`T`
