---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/cache/operations/interfaces/Op.md
---

# &#x20;Op

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:30](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L30)

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

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:34](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L34)

The name of the operation
