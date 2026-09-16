---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/spec/json-api-raw/interfaces/Links.md
---

# &#x20;Links

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:48](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L48)

The `links` member of a {json:api} resource or document.

[{json:api} Spec](https://jsonapi.org/format/#document-links)

## Extended by

* [`PaginationLinks`](PaginationLinks.md)

## Properties

### related?

```ts
optional related?: Link | null;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:52](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L52)

a link for retrieving the related resource(s)

***

### self?

```ts
optional self?: Link | null;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:56](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L56)

a link for retrieving the resource or document itself
