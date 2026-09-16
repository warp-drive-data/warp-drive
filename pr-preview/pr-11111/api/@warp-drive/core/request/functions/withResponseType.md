---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/request/functions/withResponseType.md
---

# &#x20;withResponseType()

```ts
function withResponseType<T>(obj): RequestInfo<T> & object;
```

Defined in: [warp-drive-packages/core/src/request.ts:35](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/request.ts#L35)

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

[`RequestInfo`](../../types/request/interfaces/RequestInfo.md)

## Returns
