---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/adapter/rest/type-aliases/RequestData.md
---

&#x20;

# &#x20;RequestData

```ts
type RequestData = object;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:101](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/adapter/rest.ts#L101)

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

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:109](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/adapter/rest.ts#L109)

the HTTP method that was used

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:105](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/legacy/src/adapter/rest.ts#L105)

the url that was requested
