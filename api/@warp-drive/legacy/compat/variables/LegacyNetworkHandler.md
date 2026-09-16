---
url: /api/@warp-drive/legacy/compat/variables/LegacyNetworkHandler.md
---

&#x20;

# &#x20;LegacyNetworkHandler

```ts
const LegacyNetworkHandler: Handler;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts:57](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts#L57)

A Handler that fulfills legacy `findRecord`/`findAll`/`query`/
`queryRecord`/`findBelongsTo`/`findHasMany`/`createRecord`/`updateRecord`/
`deleteRecord` requests using the store's configured [adapter](../interfaces/MinimumAdapterInterface.md)
and [serializer](../interfaces/MinimumSerializerInterface.md), passing any other
request through to the next handler unchanged.
