---
url: >-
  /api/@warp-drive/core/types/spec/json-api-raw/type-aliases/SingleResourceDocument.md
---

# &#x20;SingleResourceDocument\<T>

```ts
type SingleResourceDocument<T> = Document & object;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:372](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L372)

Represents a {json:api} document containing a single resource.

## Type Declaration

### data

```ts
data: ExistingResourceObject<T>;
```

the resource the document represents

## Type Parameters

### T

`T` *extends* `string` = `string`

## Example

```json
{
  "data": { "type": "user", "id": "1", "attributes": { "name": "Chris" } }
}
```
