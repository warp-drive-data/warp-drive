---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/spec/json-api-raw/types/Link.md
---

# &#x20;Link

```ts
type Link = string | LinkObject;
```

Defined in: [warp-drive-packages/core/src/types/spec/json-api-raw.ts:41](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/spec/json-api-raw.ts#L41)

A link is either a plain URI-reference string or a [LinkObject](LinkObject.md)
carrying additional meta information.

[{json:api} Spec](https://jsonapi.org/format/#document-links)

## Example

```ts
const simple: Link = '/articles/1/comments';
const withMeta: Link = { href: '/articles/1/comments', meta: { count: 10 } };
```
