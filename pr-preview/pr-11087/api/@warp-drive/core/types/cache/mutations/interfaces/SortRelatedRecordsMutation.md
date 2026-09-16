---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/cache/mutations/interfaces/SortRelatedRecordsMutation.md
---

# &#x20;SortRelatedRecordsMutation

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:129](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L129)

Reorders the local (uncommitted) state of a `to-many` relationship.

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:141](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L141)

The name of the relationship to reorder

***

### op

```ts
op: "sortRelatedRecords";
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:133](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L133)

The name of the mutation

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:137](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L137)

The cache key for the resource whose relationship is being reordered

***

### value

```ts
value: ResourceKey[];
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:145](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L145)

The relationship's members in their new order
