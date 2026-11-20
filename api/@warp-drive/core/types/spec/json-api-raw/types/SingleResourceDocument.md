---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/spec/json-api-raw/types/SingleResourceDocument.md
description: >-
  A raw {json:api} document whose `data` is one existing resource object, with
  optional `included`, `meta`, and `links`.
---

# &#x20;SingleResourceDocument\<T *extends* `string` = `string`>

```ts
type SingleResourceDocument<T extends string = string> = Document & {
  data: ExistingResourceObject<T>;
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:418](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L418)

Represents a {json:api} document containing a single resource.

## Type Parameters

### T

`T` *extends* `string` = `string`

## Type Declaration

### data

```ts
data: ExistingResourceObject<T>;
```

the resource the document represents

## Example

```json
{
  "data": { "type": "user", "id": "1", "attributes": { "name": "Chris" } }
}
```
