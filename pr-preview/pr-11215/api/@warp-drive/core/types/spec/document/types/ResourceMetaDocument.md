---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/spec/document/types/ResourceMetaDocument.md
---

# &#x20;ResourceMetaDocument

```ts
interface ResourceMetaDocument {
  lid?: string;
  links?: 
  | Links
  | PaginationLinks;
  meta: ObjectValue;
}
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:11](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/document.ts#L11)

This type represents a raw {json:api} document for a meta-only
document returned by a request intended to be inserted into the cache.

## Properties

### lid?

```ts
optional lid?: string;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:15](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/document.ts#L15)

the url or cache-key associated with the structured document

***

### links?

```ts
optional links?: 
  | Links
  | PaginationLinks;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:23](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/document.ts#L23)

links related to the document

***

### meta

```ts
meta: ObjectValue;
```

Defined in: [warp-drive-packages/core/src/types/spec/document.ts:19](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/document.ts#L19)

meta information about the document
