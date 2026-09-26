---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/cache/operations/types/Operation.md
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

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:266](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/types/cache/operations.ts#L266)

[Cache](../../types/Cache.md) Operations perform updates to the
Cache's "remote" (or clean) state to reflect external
changes.

Usually operations represent the result of a [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket) or
[ServerEvent](https://developer.mozilla.org/docs/Web/API/EventSource) message, though they can also be used to carefully
patch the state of the cache with information known by the
application or developer.

Operations are applied via [Cache.patch](../../types/Cache.md#patch).

See also:

* [MergeOperation](MergeOperation.md)
* [RemoveResourceOperation](RemoveResourceOperation.md)
* [RemoveDocumentOperation](RemoveDocumentOperation.md)
* [AddResourceOperation](AddResourceOperation.md)
* [UpdateResourceOperation](UpdateResourceOperation.md)
* [UpdateResourceFieldOperation](UpdateResourceFieldOperation.md)
* [AddToResourceRelationshipOperation](AddToResourceRelationshipOperation.md)
* [RemoveFromResourceRelationshipOperation](RemoveFromResourceRelationshipOperation.md)
* [AddToDocumentOperation](AddToDocumentOperation.md)
* [RemoveFromDocumentOperation](RemoveFromDocumentOperation.md)
