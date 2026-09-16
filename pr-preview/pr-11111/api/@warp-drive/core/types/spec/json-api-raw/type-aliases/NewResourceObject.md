---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/spec/json-api-raw/type-aliases/NewResourceObject.md
---

# &#x20;NewResourceObject\<T>

```ts
type NewResourceObject<T> = NewResourceIdentifierObject<T> & object;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:305](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L305)

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
