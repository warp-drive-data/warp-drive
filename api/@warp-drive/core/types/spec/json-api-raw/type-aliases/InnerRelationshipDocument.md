---
url: >-
  /api/@warp-drive/core/types/spec/json-api-raw/type-aliases/InnerRelationshipDocument.md
---

# &#x20;InnerRelationshipDocument\<T>

```ts
type InnerRelationshipDocument<T> = 
  | SingleResourceRelationship<T>
| CollectionResourceRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:253](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L253)

Represents a single {json:api} relationship, whether `to-one` or `to-many`.

See also:

* [SingleResourceRelationship](../interfaces/SingleResourceRelationship.md)
* [CollectionResourceRelationship](../interfaces/CollectionResourceRelationship.md)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
