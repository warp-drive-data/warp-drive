---
url: >-
  /api/@warp-drive/core/types/spec/json-api-raw/interfaces/SingleResourceRelationship.md
---

# &#x20;SingleResourceRelationship\<T>

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:204](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L204)

Represents a `to-one` {json:api} relationship.

[{json:api} Spec](https://jsonapi.org/format/#document-resource-object-relationships)

## Example

```json
{
  "data": { "type": "user", "id": "1" }
}
```

## Type Parameters

### T

`T` = `ExistingResourceIdentifierObject` | `NewResourceIdentifierObject`

## Properties

### data?

```ts
optional data?: T | null;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:208](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L208)

the related resource, or `null` if the relationship has no related resource

***

### links?

```ts
optional links?: Links;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:216](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L216)

links related to the relationship

***

### meta?

```ts
optional meta?: ObjectValue;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:212](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L212)

meta information about the relationship
