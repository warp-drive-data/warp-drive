---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/spec/json-api-raw/type-aliases/EmptyResourceDocument.md
---

# &#x20;EmptyResourceDocument

```ts
type EmptyResourceDocument = Document & object;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:355](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L355)

Represents a {json:api} document containing no resource, for
instance the response to a `DELETE` request or a `to-one`
relationship pointing at nothing.

## Type Declaration

### data

```ts
data: null;
```

always `null` for an empty resource document

## Example

```json
{ "data": null }
```
