---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/graph/interfaces/SortRelatedRecords.md
---

# &#x20;SortRelatedRecords

Defined in: [warp-drive-packages/core/src/types/graph.ts:119](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/graph.ts#L119)

Reorders the state of a `to-many` relationship on the Graph.

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:131](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/graph.ts#L131)

The name of the relationship to reorder

***

### op

```ts
op: "sortRelatedRecords";
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:123](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/graph.ts#L123)

The name of the operation

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:127](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/graph.ts#L127)

The cache key for the resource whose relationship is being reordered

***

### value

```ts
value: ResourceKey[];
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:135](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/graph.ts#L135)

The relationship's members in their new order
