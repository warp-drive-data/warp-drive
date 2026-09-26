---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/legacy/adapter/rest/types/FetchRequestInit.md
description: >-
  `fetch` options plus `url`, `method`, and `type` that the legacy `RESTAdapter`
  builds for a request sent with the native `fetch` API.
---

&#x20;

# &#x20;FetchRequestInit

```ts
interface FetchRequestInit extends RequestInit {
  method: HTTPMethod;
  type: HTTPMethod;
  url: string;
}
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:75](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/legacy/src/adapter/rest.ts#L75)

The options passed to the native `fetch` API by RESTAdapter.\_fetchRequest | \_fetchRequest.

## Extends

* `RequestInit`

## Properties

### method

```ts
method: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:83](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/legacy/src/adapter/rest.ts#L83)

the HTTP method to use

#### Overrides

```ts
RequestInit.method
```

***

### type

```ts
type: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:87](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/legacy/src/adapter/rest.ts#L87)

the HTTP method to use, duplicated for jQuery/fetch option compatibility

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:79](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/legacy/src/adapter/rest.ts#L79)

the url to request
