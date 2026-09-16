---
url: /api/@warp-drive/core/functions/setKeyInfoForResource.md
---

# &#x20;setKeyInfoForResource()

```ts
function setKeyInfoForResource(method): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:291](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L291)

Configure a callback for when the identifier cache is generating a new
ResourceKey for a resource.

This method controls the `type` and `id` that will be assigned to the
`ResourceKey` that is created.

This configuration MUST occur prior to the store instance being created.

```js
import { setKeyInfoForResource } from '@warp-drive/core';
```

## Parameters

### method

`KeyInfoMethod` | `null`

## Returns

`void`
