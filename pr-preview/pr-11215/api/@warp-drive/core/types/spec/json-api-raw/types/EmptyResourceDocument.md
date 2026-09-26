---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/spec/json-api-raw/types/EmptyResourceDocument.md
---

# &#x20;EmptyResourceDocument

```ts
type EmptyResourceDocument = Document & {
  data: null;
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:355](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L355)

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
