---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/cache/operations/type-aliases/Operation.md
---

# &#x20;Operation

```ts
type Operation = 
  | MergeOperation
  | RemoveResourceOperation
  | RemoveDocumentOperation
  | AddResourceOperation
  | UpdateResourceOperation
  | UpdateResourceFieldOperation
  | AddToResourceRelationshipOperation
  | RemoveFromResourceRelationshipOperation
  | AddToDocumentOperation
  | RemoveFromDocumentOperation;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:266](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L266)

[Cache](../../interfaces/Cache.md) Operations perform updates to the
Cache's "remote" (or clean) state to reflect external
changes.

Usually operations represent the result of a [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket) or
[ServerEvent](https://developer.mozilla.org/docs/Web/API/EventSource) message, though they can also be used to carefully
patch the state of the cache with information known by the
application or developer.

Operations are applied via [Cache.patch](../../interfaces/Cache.md#patch).

See also:

* [MergeOperation](../interfaces/MergeOperation.md)
* [RemoveResourceOperation](../interfaces/RemoveResourceOperation.md)
* [RemoveDocumentOperation](../interfaces/RemoveDocumentOperation.md)
* [AddResourceOperation](../interfaces/AddResourceOperation.md)
* [UpdateResourceOperation](../interfaces/UpdateResourceOperation.md)
* [UpdateResourceFieldOperation](../interfaces/UpdateResourceFieldOperation.md)
* [AddToResourceRelationshipOperation](../interfaces/AddToResourceRelationshipOperation.md)
* [RemoveFromResourceRelationshipOperation](../interfaces/RemoveFromResourceRelationshipOperation.md)
* [AddToDocumentOperation](../interfaces/AddToDocumentOperation.md)
* [RemoveFromDocumentOperation](../interfaces/RemoveFromDocumentOperation.md)
