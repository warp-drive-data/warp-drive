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

Defined in: [warp-drive-packages/core/src/types/graph.ts:206](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/graph.ts#L206)

The Graph operations that apply to a relationship's local
(uncommitted/dirty) state.

See also:

* [ReplaceRelatedRecordsOperation](../interfaces/ReplaceRelatedRecordsOperation.md)
* [ReplaceRelatedRecordOperation](../interfaces/ReplaceRelatedRecordOperation.md)
* [AddResourceMutation](../../cache/mutations/interfaces/AddToResourceRelationshipMutation.md)
* [RemoveResourceMutation](../../cache/mutations/interfaces/RemoveFromResourceRelationshipMutation.md)
* [SortRelatedRecords](../interfaces/SortRelatedRecords.md)
