---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/legacy/model/migration-support/type-aliases/WithLegacyDerivations.md
---

&#x20;

# &#x20;WithLegacyDerivations\<T>

```ts
type WithLegacyDerivations<T> = T & MinimalLegacyRecord & object;
```

Defined in: [warp-drive-packages/legacy/src/model/migration-support.ts:87](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/legacy/src/model/migration-support.ts#L87)

Adds the `Model`-style `belongsTo`/`hasMany` reference methods to a
[TypedRecordInstance](../../../../core/types/record/interfaces/TypedRecordInstance.md), for use when migrating a resource from
`Model` to a schema-based record while preserving these APIs.

## Type Declaration

### belongsTo

```ts
belongsTo: typeof belongsTo;
```

see belongsTo

### hasMany

```ts
hasMany: typeof hasMany;
```

see hasMany

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](../../../../core/types/record/interfaces/TypedRecordInstance.md)
