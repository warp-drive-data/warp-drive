---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/spec/json-api-raw/type-aliases/NewResourceObject.md
---

# &#x20;NewResourceObject\<T>

```ts
type NewResourceObject<T> = NewResourceIdentifierObject<T> & object;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:305](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L305)

Represents a new resource that has not yet been persisted, as it would
appear in a {json:api} document (for instance, the body of a `POST` request).

## Type Declaration

### attributes?

```ts
optional attributes?: ObjectValue;
```

the resource's attributes

### links?

```ts
optional links?: Links;
```

links related to the resource

### meta?

```ts
optional meta?: Meta;
```

meta information about the resource

### relationships?

```ts
optional relationships?: ResourceRelationshipsObject;
```

the resource's relationships to other resources

## Type Parameters

### T

`T` *extends* `string` = `string`

## Example

```json
{
  "data": {
    "type": "user",
    "lid": "@lid:user-1",
    "attributes": { "name": "Chris" }
  }
}
```
