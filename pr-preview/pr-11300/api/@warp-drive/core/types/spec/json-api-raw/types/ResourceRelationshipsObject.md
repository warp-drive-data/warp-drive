---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/types/spec/json-api-raw/types/ResourceRelationshipsObject.md
description: >-
  The `relationships` member of a {json:api} resource object: to-one or to-many
  relationship objects keyed by relationship name.
---

# &#x20;ResourceRelationshipsObject\<T = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`>

```ts
type ResourceRelationshipsObject<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> = Record<string, InnerRelationshipDocument<T>>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:298](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L298)

The `relationships` member of a {json:api} resource object, keyed
by relationship name.

[{json:api} Spec](https://jsonapi.org/format/#document-resource-object-relationships)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
