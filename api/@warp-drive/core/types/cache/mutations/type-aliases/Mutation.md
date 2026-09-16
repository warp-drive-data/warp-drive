---
url: /api/@warp-drive/core/types/cache/mutations/type-aliases/Mutation.md
---

# &#x20;Mutation

```ts
type Mutation = 
  | ReplaceRelatedRecordsMutation
  | ReplaceRelatedRecordMutation
  | RemoveFromResourceRelationshipMutation
  | AddToResourceRelationshipMutation
  | SortRelatedRecordsMutation;
```

Defined in: [warp-drive-packages/core/src/types/cache/mutations.ts:171](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/types/cache/mutations.ts#L171)

A `Mutation` is an action that updates the local (uncommitted or "dirty")
state of the [Cache](../../interfaces/Cache.md) in some manner.

Most Mutations are in theory also [Operations](../../operations/type-aliases/Operation.md); the
difference is that the change should be applied as local/dirty state
instead of as remote/clean state.

Mutations are applied via [Cache.mutate](../../interfaces/Cache.md#mutate).

See also:

* [ReplaceRelatedRecordsMutation](../interfaces/ReplaceRelatedRecordsMutation.md)
* [ReplaceRelatedRecordMutation](../interfaces/ReplaceRelatedRecordMutation.md)
* [RemoveFromResourceRelationshipMutation](../interfaces/RemoveFromResourceRelationshipMutation.md)
* [AddToResourceRelationshipMutation](../interfaces/AddToResourceRelationshipMutation.md)
* [SortRelatedRecordsMutation](../interfaces/SortRelatedRecordsMutation.md)
