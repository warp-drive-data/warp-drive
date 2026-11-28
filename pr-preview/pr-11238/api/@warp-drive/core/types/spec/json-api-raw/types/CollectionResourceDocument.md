---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/spec/json-api-raw/types/CollectionResourceDocument.md
description: >-
  A raw {json:api} document whose `data` is an array of existing resource
  objects, with optional `included`, `meta`, and `links`.
---

# &#x20;CollectionResourceDocument\<T *extends* `string` = `string`>

```ts
type CollectionResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>[];
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:437](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L437)

Represents a {json:api} document containing a collection of resources.

## Type Parameters

### T

`T` *extends* `string` = `string`

## Type Declaration

### data

```ts
data: ExistingResourceObject<T>[];
```

the resources the document represents

## Example

```json
{
  "data": [{ "type": "user", "id": "1", "attributes": { "name": "Chris" } }]
}
```
