---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/legacy/compat/variables/LegacyNetworkHandler.md
---

&#x20;

# &#x20;LegacyNetworkHandler

```ts
const LegacyNetworkHandler: Handler;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts:57](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts#L57)

A Handler that fulfills legacy `findRecord`/`findAll`/`query`/
`queryRecord`/`findBelongsTo`/`findHasMany`/`createRecord`/`updateRecord`/
`deleteRecord` requests using the store's configured [adapter](../interfaces/MinimumAdapterInterface.md)
and [serializer](../interfaces/MinimumSerializerInterface.md), passing any other
request through to the next handler unchanged.
