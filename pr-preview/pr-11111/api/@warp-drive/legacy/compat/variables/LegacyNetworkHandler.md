---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/legacy/compat/variables/LegacyNetworkHandler.md
---

&#x20;

# &#x20;LegacyNetworkHandler

```ts
const LegacyNetworkHandler: Handler;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts:57](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts#L57)

A Handler that fulfills legacy `findRecord`/`findAll`/`query`/
`queryRecord`/`findBelongsTo`/`findHasMany`/`createRecord`/`updateRecord`/
`deleteRecord` requests using the store's configured [adapter](../interfaces/MinimumAdapterInterface.md)
and [serializer](../interfaces/MinimumSerializerInterface.md), passing any other
request through to the next handler unchanged.
