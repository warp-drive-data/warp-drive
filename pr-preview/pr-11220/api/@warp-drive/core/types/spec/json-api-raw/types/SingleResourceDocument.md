---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/types/spec/json-api-raw/types/SingleResourceDocument.md
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

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:418](https://github.com/warp-drive-data/warp-drive/blob/37b729cb1f8483d0de8bbbe89258e7a61745f8ed/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L418)

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
