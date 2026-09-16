---
url: /api/@warp-drive/core/types/cache/relationship/type-aliases/Relationship.md
---

# &#x20;Relationship\<T>

```ts
type Relationship<T> = 
  | ResourceRelationship<T>
| CollectionRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:72](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/cache/relationship.ts#L72)

The stable-cache-key form of a relationship, whether `to-one` or `to-many`.

See also:

* [ResourceRelationship](../interfaces/ResourceRelationship.md)
* [CollectionRelationship](../interfaces/CollectionRelationship.md)

## Type Parameters

### T

`T` = [`ResourceKey`](../../../identifier/type-aliases/ResourceKey.md)
