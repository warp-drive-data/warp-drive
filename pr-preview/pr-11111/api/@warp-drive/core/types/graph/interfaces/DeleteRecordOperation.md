---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/graph/interfaces/DeleteRecordOperation.md
---

# &#x20;DeleteRecordOperation

Defined in: [warp-drive-packages/core/src/types/graph.ts:51](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L51)

Signals to the Graph that a resource has been deleted, so that
it can be removed from any relationships that reference it.

## Properties

### isNew

```ts
isNew: boolean;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:63](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L63)

Whether the resource was a client-created resource that had not yet been persisted

***

### op

```ts
op: "deleteRecord";
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:55](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L55)

The name of the operation

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:59](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L59)

The cache key for the resource that was deleted
