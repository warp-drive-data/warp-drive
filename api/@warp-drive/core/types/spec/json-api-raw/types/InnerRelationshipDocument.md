---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/spec/json-api-raw/types/InnerRelationshipDocument.md
description: >-
  A single {json:api} relationship object, either to-one or to-many, as found in
  a resource's `relationships` member.
---

# &#x20;InnerRelationshipDocument\<T = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`>

```ts
type InnerRelationshipDocument<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> = 
  | SingleResourceRelationship<T>
| CollectionResourceRelationship<T>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:285](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L285)

Represents a single {json:api} relationship, whether `to-one` or `to-many`.

See also:

* [SingleResourceRelationship](SingleResourceRelationship.md)
* [CollectionResourceRelationship](CollectionResourceRelationship.md)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
