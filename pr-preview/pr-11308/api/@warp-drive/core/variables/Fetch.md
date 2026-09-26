---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/variables/Fetch.md
description: >-
  Terminal request handler that sends the request with native `fetch` and
  resolves with the parsed JSON body, turning HTTP failures into errors.
---

# &#x20;Fetch

```ts
const Fetch: {
  request: Promise<T>;
};
```

Defined in: [warp-drive-packages/core/src/request/-private/fetch.ts:136](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/request/-private/fetch.ts#L136)

```ts
import { Fetch } from '@warp-drive/core';
```

A basic Fetch Handler which converts a request into a
`fetch` call presuming the response to be `json`.

```ts
import { RequestManager, Fetch } from '@warp-drive/core';

const manager = new RequestManager()
  .use([Fetch]);
```

## Type Declaration

### request()

```ts
request<T>(context: Context): Promise<T>;
```

Issues the request via native `fetch`, setting the response and
(when requested) streaming the decoded body via [Context.setStream](../request/types/Context.md#setstream)
as it downloads, then resolves with the parsed JSON body.

#### Type Parameters

##### T

`T`

#### Parameters

##### context

[`Context`](../request/types/Context.md)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`T`>
