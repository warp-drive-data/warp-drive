---
url: /api/@warp-drive/core/types/graph/interfaces/UpdateRelationshipOperation.md
---

# &#x20;UpdateRelationshipOperation

Defined in: [warp-drive-packages/core/src/types/graph.ts:28](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/graph.ts#L28)

Replaces the state of a relationship on the Graph with a new state.

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:40](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/graph.ts#L40)

The name of the relationship to update

***

### op

```ts
op: "updateRelationship";
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:32](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/graph.ts#L32)

The name of the operation

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:36](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/graph.ts#L36)

The cache key for the resource whose relationship is being updated

***

### value

```ts
value: 
  | SingleResourceRelationship<
  | ExistingResourceIdentifierObject<string>
  | NewResourceIdentifierObject<string>>
  | CollectionResourceRelationship<
  | ExistingResourceIdentifierObject<string>
| NewResourceIdentifierObject<string>>;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:44](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/graph.ts#L44)

The new state for the relationship
