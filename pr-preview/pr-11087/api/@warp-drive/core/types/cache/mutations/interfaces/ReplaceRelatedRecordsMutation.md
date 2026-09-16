---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/cache/mutations/interfaces/ReplaceRelatedRecordsMutation.md
---

# &#x20;ReplaceRelatedRecordsMutation

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:97](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L97)

Replaces the local (uncommitted) state of a `to-many` relationship
with a new set of values.

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:109](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L109)

The name of the relationship to replace

***

### index?

```ts
optional index?: number;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:123](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L123)

If this is a "splice", the index to start from

***

### op

```ts
op: "replaceRelatedRecords";
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:101](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L101)

The name of the mutation

***

### prior?

```ts
optional prior?: ResourceKey[];
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:119](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L119)

If this is a "splice", the resources expected to be removed

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:105](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L105)

The cache key for the resource whose relationship is being updated

***

### value

```ts
value: ResourceKey[];
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:115](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/mutations.ts#L115)

The resources to add. If neither [prior](#prior)
nor [index](#index) is specified, all
existing members should be removed.
