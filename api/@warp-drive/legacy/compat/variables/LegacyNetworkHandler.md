---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/legacy/compat/variables/LegacyNetworkHandler.md
description: >-
  Legacy `RequestManager` handler that fulfills find, query, create, update, and
  delete operations through the store's adapters and serializers, passing other
  requests along.
---

&#x20;

# &#x20;LegacyNetworkHandler

```ts
const LegacyNetworkHandler: Handler;
```

Defined in: [warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts:60](https://github.com/warp-drive-data/warp-drive/blob/1fcf89cc668a45be1ea010edae0840ffaa7dd21d/warp-drive-packages/legacy/src/compat/legacy-network-handler/legacy-network-handler.ts#L60)

A Handler that fulfills legacy `findRecord`/`findAll`/`query`/
`queryRecord`/`findBelongsTo`/`findHasMany`/`createRecord`/`updateRecord`/
`deleteRecord` requests using the store's configured [adapter](../types/MinimumAdapterInterface.md)
and [serializer](../types/MinimumSerializerInterface.md), passing any other
request through to the next handler unchanged.
