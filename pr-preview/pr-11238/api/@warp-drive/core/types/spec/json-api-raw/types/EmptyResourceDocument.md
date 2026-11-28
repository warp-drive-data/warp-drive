---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/spec/json-api-raw/types/EmptyResourceDocument.md
description: >-
  A raw {json:api} document whose `data` is `null`, such as the response to a
  `DELETE` request.
---

# &#x20;EmptyResourceDocument

```ts
type EmptyResourceDocument = Document & {
  data: null;
};
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:399](https://github.com/warp-drive-data/warp-drive/blob/16266e84cb8f768b9368b912524789ccbce1d3b1/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L399)

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
