---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/request/types/ResponseInfo.md
description: >-
  Immutable, JSON-serializable snapshot of a fetch `Response`'s headers, status,
  url, and type, usable in place of a `Response` in request results.
---

# &#x20;ResponseInfo

```ts
interface ResponseInfo {
  readonly headers: ImmutableHeaders;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
}
```

Defined in: [warp-drive-packages/core/src/types/request.ts:798](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L798)

An immutable, JSON-serializable subset of the native [Response](https://developer.mozilla.org/docs/Web/API/Response)
interface.

## Properties

### headers

```ts
readonly headers: ImmutableHeaders;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:802](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L802)

see [ImmutableHeaders](ImmutableHeaders.md)

***

### ok

```ts
readonly ok: boolean;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:806](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L806)

whether the response's status code was in the 200-299 range

***

### redirected

```ts
readonly redirected: boolean;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:810](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L810)

whether the response is the result of a redirect

***

### status

```ts
readonly status: number;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:814](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L814)

the response's HTTP status code

***

### statusText

```ts
readonly statusText: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:818](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L818)

the status message associated with the response's status code

***

### type

```ts
readonly type: ResponseType;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:822](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L822)

the type of the response, see [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/type)

***

### url

```ts
readonly url: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:826](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/core/src/types/request.ts#L826)

the url of the response
