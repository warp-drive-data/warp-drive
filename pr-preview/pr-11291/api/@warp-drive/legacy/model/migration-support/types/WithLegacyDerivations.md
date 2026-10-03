---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/legacy/model/migration-support/types/WithLegacyDerivations.md
description: >-
  Legacy type that adds the `Model`-style `belongsTo` and `hasMany` reference
  methods to a typed record migrating from `Model` to a schema-based record.
---

&#x20;

# &#x20;WithLegacyDerivations\<T *extends* [`TypedRecordInstance`](../../../../core/types/record/types/TypedRecordInstance.md)>

```ts
type WithLegacyDerivations<T extends TypedRecordInstance> = T & MinimalLegacyRecord & {
  belongsTo: typeof belongsTo;
  hasMany: typeof hasMany;
};
```

Defined in: [warp-drive-packages/legacy/src/model/migration-support.ts:92](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/legacy/src/model/migration-support.ts#L92)

Adds the `Model`-style `belongsTo`/`hasMany` reference methods to a
[TypedRecordInstance](../../../../core/types/record/types/TypedRecordInstance.md), for use when migrating a resource from
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

`T` *extends* [`TypedRecordInstance`](../../../../core/types/record/types/TypedRecordInstance.md)
