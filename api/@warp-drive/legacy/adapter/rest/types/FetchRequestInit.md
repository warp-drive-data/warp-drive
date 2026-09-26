---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/adapter/rest/types/FetchRequestInit.md
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

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:75](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/legacy/src/adapter/rest.ts#L75)

The options passed to the native `fetch` API by RESTAdapter.\_fetchRequest | \_fetchRequest.

## Extends

* `RequestInit`

## Properties

### method

```ts
method: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:83](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/legacy/src/adapter/rest.ts#L83)

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

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:87](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/legacy/src/adapter/rest.ts#L87)

the HTTP method to use, duplicated for jQuery/fetch option compatibility

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:79](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/legacy/src/adapter/rest.ts#L79)

the url to request
