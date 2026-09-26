---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/core/types/spec/json-api-raw/types/ResourceRelationshipsObject.md
description: >-
  The `relationships` member of a {json:api} resource object: to-one or to-many
  relationship objects keyed by relationship name.
---

# &#x20;ResourceRelationshipsObject\<T = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`>

```ts
type ResourceRelationshipsObject<T = ExistingResourceIdentifierObject | NewResourceIdentifierObject> = Record<string, InnerRelationshipDocument<T>>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:298](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L298)

The `relationships` member of a {json:api} resource object, keyed
by relationship name.

[{json:api} Spec](https://jsonapi.org/format/#document-resource-object-relationships)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
