---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/request/functions/withResponseType.md
description: >-
  Types a request object with the response type that `store.request` or
  `RequestManager.request` should resolve with; no runtime effect.
---

# &#x20;withResponseType()

```ts
function withResponseType<T>(obj: RequestInfo): RequestInfo<T> & {
  ___(unique) Symbol(RequestSignature): T;
};
```

Defined in: [warp-drive-packages/core/src/request.ts:43](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/request.ts#L43)

Brands the supplied object with the supplied response type.

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withResponseType } from '@warp-drive/core/request';
import type { User } from '#/data/user.ts'

const result = await store.request(
 withResponseType<ReactiveDataDocument<User>>({ url: '/users/1' })
);

result.content.data; // will have type User
```

## Type Parameters

### T

`T`

## Parameters

### obj

[`RequestInfo`](../../types/request/types/RequestInfo.md)

## Returns
