---
url: /api/@warp-drive/core/types/cache/operations/types/Op.md
---

# &#x20;Op

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:30](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/core/src/types/cache/operations.ts#L30)

All operations are objects with at least one property,
`op` which contains a string with the name of the operation
to perform.

## Extended by

* [`MergeOperation`](MergeOperation.md)
* [`RemoveDocumentOperation`](RemoveDocumentOperation.md)
* [`RemoveResourceOperation`](RemoveResourceOperation.md)
* [`AddResourceOperation`](AddResourceOperation.md)
* [`UpdateResourceOperation`](UpdateResourceOperation.md)
* [`UpdateResourceFieldOperation`](UpdateResourceFieldOperation.md)
* [`UpdateResourceRelationshipOperation`](UpdateResourceRelationshipOperation.md)
* [`AddToDocumentOperation`](AddToDocumentOperation.md)
* [`AddToResourceRelationshipOperation`](AddToResourceRelationshipOperation.md)
* [`RemoveFromResourceRelationshipOperation`](RemoveFromResourceRelationshipOperation.md)
* [`RemoveFromDocumentOperation`](RemoveFromDocumentOperation.md)

## Properties

### op

```ts
op: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:34](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/core/src/types/cache/operations.ts#L34)

The name of the operation
