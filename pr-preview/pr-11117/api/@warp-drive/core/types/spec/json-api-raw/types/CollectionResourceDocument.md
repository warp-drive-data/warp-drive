---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/spec/json-api-raw/types/CollectionResourceDocument.md
---

# &#x20;CollectionResourceDocument\<T *extends* `string` = `string`>

```ts
type CollectionResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>[];
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:389](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L389)

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
