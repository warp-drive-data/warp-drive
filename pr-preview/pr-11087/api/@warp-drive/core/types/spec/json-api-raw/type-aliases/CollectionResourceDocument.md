---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/spec/json-api-raw/type-aliases/CollectionResourceDocument.md
---

# &#x20;CollectionResourceDocument\<T>

```ts
type CollectionResourceDocument<T> = Document & object;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:389](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L389)

Represents a {json:api} document containing a collection of resources.

## Type Declaration

### data

```ts
data: ExistingResourceObject<T>[];
```

the resources the document represents

## Type Parameters

### T

`T` *extends* `string` = `string`

## Example

```json
{
  "data": [{ "type": "user", "id": "1", "attributes": { "name": "Chris" } }]
}
```
