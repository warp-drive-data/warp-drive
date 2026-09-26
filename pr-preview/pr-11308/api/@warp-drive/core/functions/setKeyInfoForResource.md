---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/functions/setKeyInfoForResource.md
description: >-
  Overrides how the store derives the `type` and `id` of a new `ResourceKey`
  from resource data; must be set before the store is created.
---

# &#x20;setKeyInfoForResource()

```ts
function setKeyInfoForResource(method: KeyInfoMethod | null): void;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts:364](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/store/-private/managers/cache-key-manager.ts#L364)

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
