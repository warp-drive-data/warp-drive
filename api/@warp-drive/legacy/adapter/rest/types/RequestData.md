---
url: /api/@warp-drive/legacy/adapter/rest/types/RequestData.md
---

&#x20;

# &#x20;RequestData

```ts
type RequestData = {
  [key: string]: unknown;
  method: HTTPMethod;
  url: string;
};
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:101](https://github.com/warp-drive-data/warp-drive/blob/8469e17a196969acc93511c466120ba3296f8da7/warp-drive-packages/legacy/src/adapter/rest.ts#L101)

A minimal description of an in-flight request, used for building
error messages when a request fails.

## Indexable

```ts
[key: string]: unknown
```

## Properties

### method

```ts
method: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:109](https://github.com/warp-drive-data/warp-drive/blob/8469e17a196969acc93511c466120ba3296f8da7/warp-drive-packages/legacy/src/adapter/rest.ts#L109)

the HTTP method that was used

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:105](https://github.com/warp-drive-data/warp-drive/blob/8469e17a196969acc93511c466120ba3296f8da7/warp-drive-packages/legacy/src/adapter/rest.ts#L105)

the url that was requested
