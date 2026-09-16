---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/cache/relationship/type-aliases/Relationship.md
---

# &#x20;Relationship\<T>

```ts
type Relationship<T> = 
  | ResourceRelationship<T>
| CollectionRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:72](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/cache/relationship.ts#L72)

The stable-cache-key form of a relationship, whether `to-one` or `to-many`.

See also:

* [ResourceRelationship](../interfaces/ResourceRelationship.md)
* [CollectionRelationship](../interfaces/CollectionRelationship.md)

## Type Parameters

### T

`T` = [`ResourceKey`](../../../identifier/type-aliases/ResourceKey.md)
