---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/spec/json-api-raw/types/CollectionResourceDocument.md
---

# &#x20;CollectionResourceDocument\<T *extends* `string` = `string`>

```ts
type CollectionResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>[];
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:389](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L389)

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
