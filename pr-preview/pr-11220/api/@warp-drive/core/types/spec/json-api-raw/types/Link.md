---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/types/spec/json-api-raw/types/Link.md
description: >-
  A {json:api} link value, either a plain URI-reference string or an object with
  `href` and optional `meta`.
---

# &#x20;Link

```ts
type Link = string | LinkObject;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:54](https://github.com/warp-drive-data/warp-drive/blob/37b729cb1f8483d0de8bbbe89258e7a61745f8ed/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L54)

A link is either a plain URI-reference string or a [LinkObject](LinkObject.md)
carrying additional meta information.

[{json:api} Spec](https://jsonapi.org/format/#document-links)

## Example

```ts
const simple: Link = '/articles/1/comments';
const withMeta: Link = { href: '/articles/1/comments', meta: { count: 10 } };
```
