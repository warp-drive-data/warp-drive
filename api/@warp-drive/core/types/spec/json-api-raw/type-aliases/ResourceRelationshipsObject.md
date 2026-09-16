---
url: >-
  /api/@warp-drive/core/types/spec/json-api-raw/type-aliases/ResourceRelationshipsObject.md
---

# &#x20;ResourceRelationshipsObject\<T>

```ts
type ResourceRelationshipsObject<T> = Record<string, InnerRelationshipDocument<T>>;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:263](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L263)

The `relationships` member of a {json:api} resource object, keyed
by relationship name.

[{json:api} Spec](https://jsonapi.org/format/#document-resource-object-relationships)

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`
