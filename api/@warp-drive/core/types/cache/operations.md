---
url: /api/@warp-drive/core/types/cache/operations.md
---

[Cache](../interfaces/Cache.md) Operations perform updates to the
Cache's "remote" (or clean) state to reflect external
changes.

Usually operations represent the result of a [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket) or
[ServerEvent](https://developer.mozilla.org/docs/Web/API/EventSource) message, though they can also be used to carefully
patch the state of the cache with information known by the
application or developer.

Operations are applied via [Cache.patch](../interfaces/Cache.md#patch).

See also Mutation, which applies analogous updates to the
Cache's "local" (or dirty) state.

## Types

* [AddResourceOperation](interfaces/AddResourceOperation.md)
* [AddToDocumentOperation](interfaces/AddToDocumentOperation.md)
* [AddToResourceRelationshipOperation](interfaces/AddToResourceRelationshipOperation.md)
* [MergeOperation](interfaces/MergeOperation.md)
* [Op](interfaces/Op.md)
* [RemoveDocumentOperation](interfaces/RemoveDocumentOperation.md)
* [RemoveFromDocumentOperation](interfaces/RemoveFromDocumentOperation.md)
* [RemoveFromResourceRelationshipOperation](interfaces/RemoveFromResourceRelationshipOperation.md)
* [RemoveResourceOperation](interfaces/RemoveResourceOperation.md)
* [UpdateResourceFieldOperation](interfaces/UpdateResourceFieldOperation.md)
* [UpdateResourceOperation](interfaces/UpdateResourceOperation.md)
* [UpdateResourceRelationshipOperation](interfaces/UpdateResourceRelationshipOperation.md)
* [Operation](type-aliases/Operation.md)
