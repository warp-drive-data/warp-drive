---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/graph/type-aliases/LocalRelationshipOperation.md
---

# &#x20;LocalRelationshipOperation

```ts
type LocalRelationshipOperation = 
  | ReplaceRelatedRecordsOperation
  | ReplaceRelatedRecordOperation
  | AddToResourceRelationshipMutation
  | RemoveFromResourceRelationshipMutation
  | SortRelatedRecords;
```

Defined in: [warp-drive-packages/core/src/types/graph.ts:206](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/graph.ts#L206)

The Graph operations that apply to a relationship's local
(uncommitted/dirty) state.

See also:

* [ReplaceRelatedRecordsOperation](../interfaces/ReplaceRelatedRecordsOperation.md)
* [ReplaceRelatedRecordOperation](../interfaces/ReplaceRelatedRecordOperation.md)
* [AddResourceMutation](../../cache/mutations/interfaces/AddToResourceRelationshipMutation.md)
* [RemoveResourceMutation](../../cache/mutations/interfaces/RemoveFromResourceRelationshipMutation.md)
* [SortRelatedRecords](../interfaces/SortRelatedRecords.md)
