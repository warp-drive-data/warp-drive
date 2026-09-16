---
url: /api/@warp-drive/legacy/adapter/rest/interfaces/JQueryRequestInit.md
---

&#x20;

# &#x20;JQueryRequestInit

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:82](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/adapter/rest.ts#L82)

The options passed to jQuery's `$.ajax` by RESTAdapter.\_ajaxRequest | \_ajaxRequest.

## Extends

* `JQueryAjaxSettings`

## Properties

### method

```ts
method: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:90](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/adapter/rest.ts#L90)

the HTTP method to use

#### Overrides

```ts
JQueryAjaxSettings.method
```

***

### type

```ts
type: HTTPMethod;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:94](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/adapter/rest.ts#L94)

the HTTP method to use, duplicated for jQuery/fetch option compatibility

#### Overrides

```ts
JQueryAjaxSettings.type
```

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:86](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/adapter/rest.ts#L86)

the url to request

#### Overrides

```ts
JQueryAjaxSettings.url
```
