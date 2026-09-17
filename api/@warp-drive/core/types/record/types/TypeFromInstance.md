---
url: /api/@warp-drive/core/types/record/types/TypeFromInstance.md
---

# &#x20;TypeFromInstance\<T>

```ts
type TypeFromInstance<T> = T extends TypedRecordInstance ? T[typeof Type] : never;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:38](https://github.com/warp-drive-data/warp-drive/blob/331a6acae2c14f865cc913111e8f3f2d4f6d7e44/warp-drive-packages/core/src/types/record.ts#L38)

A type utility that extracts the Type if available,
otherwise it returns never.

## Type Parameters

### T

`T`
