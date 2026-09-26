---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/cache/relationship/types/Relationship.md
---

# &#x20;Relationship\<T = [`ResourceKey`](../../../identifier/types/ResourceKey.md)>

```ts
type Relationship<T = ResourceKey> = 
  | ResourceRelationship<T>
| CollectionRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:72](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/cache/relationship.ts#L72)

The stable-cache-key form of a relationship, whether `to-one` or `to-many`.

See also:

* [ResourceRelationship](ResourceRelationship.md)
* [CollectionRelationship](CollectionRelationship.md)

## Type Parameters

### T

`T` = [`ResourceKey`](../../../identifier/types/ResourceKey.md)
