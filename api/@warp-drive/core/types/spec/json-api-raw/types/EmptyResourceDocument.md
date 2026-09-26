---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/spec/json-api-raw/types/EmptyResourceDocument.md
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

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:399](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L399)

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
