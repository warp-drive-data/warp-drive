---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/cache/mutations/interfaces/RemoveFromResourceRelationshipMutation.md
---

# &#x20;RemoveFromResourceRelationshipMutation

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:38](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L38)

Removes the specified [ResourceKeys](../../../identifier/type-aliases/ResourceKey.md) from a relationship's
local (uncommitted) state.

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:50](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L50)

The name of the relationship to remove from

***

### index?

```ts
optional index?: number;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:58](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L58)

The index to remove the resource(s) from, if applicable

***

### op

```ts
op: "remove";
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:42](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L42)

The name of the mutation

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:46](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L46)

The cache key for the resource whose relationship is being updated

***

### value

```ts
value: 
  | ResourceKey
  | ResourceKey[];
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:54](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/cache/mutations.ts#L54)

The resource(s) to remove from the relationship
