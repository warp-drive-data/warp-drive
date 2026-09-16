---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/spec/json-api-raw/type-aliases/InnerRelationshipDocument.md
---

# &#x20;InnerRelationshipDocument\<T>

```ts
type InnerRelationshipDocument<T> = 
  | SingleResourceRelationship<T>
| CollectionResourceRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:253](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L253)

Represents a single {json:api} relationship, whether `to-one` or `to-many`.

See also:

* [SingleResourceRelationship](../interfaces/SingleResourceRelationship.md)
* [CollectionResourceRelationship](../interfaces/CollectionResourceRelationship.md)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
