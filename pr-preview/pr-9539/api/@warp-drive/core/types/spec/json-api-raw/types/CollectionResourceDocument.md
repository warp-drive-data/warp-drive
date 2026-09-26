---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/spec/json-api-raw/types/CollectionResourceDocument.md
---

# &#x20;CollectionResourceDocument\<T *extends* `string` = `string`>

```ts
type CollectionResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>[];
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:389](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L389)

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
