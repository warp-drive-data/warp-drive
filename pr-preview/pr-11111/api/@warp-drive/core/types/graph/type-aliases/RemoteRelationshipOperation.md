---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/graph/type-aliases/RemoteRelationshipOperation.md
---

# &#x20;RemoteRelationshipOperation

```ts
type RemoteRelationshipOperation = 
  | UpdateResourceRelationshipOperation
  | UpdateRelationshipOperation
  | ReplaceRelatedRecordOperation
  | ReplaceRelatedRecordsOperation
  | RemoveFromResourceRelationshipOperation
  | AddToResourceRelationshipOperation
  | DeleteRecordOperation
  | SortRelatedRecords;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:185](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L185)

The Graph operations that apply to a relationship's remote
(persisted/clean) state.

See also:

* [UpdateResourceRelationshipOperation](../../cache/operations/interfaces/UpdateResourceRelationshipOperation.md)
* [UpdateRelationshipOperation](../interfaces/UpdateRelationshipOperation.md)
* [ReplaceRelatedRecordOperation](../interfaces/ReplaceRelatedRecordOperation.md)
* [ReplaceRelatedRecordsOperation](../interfaces/ReplaceRelatedRecordsOperation.md)
* [RemoveResourceOperation](../../cache/operations/interfaces/RemoveFromResourceRelationshipOperation.md)
* [AddResourceOperation](../../cache/operations/interfaces/AddToResourceRelationshipOperation.md)
* [DeleteRecordOperation](../interfaces/DeleteRecordOperation.md)
* [SortRelatedRecords](../interfaces/SortRelatedRecords.md)
