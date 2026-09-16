---
url: /api/@warp-drive/core/signals/-leaked/interfaces/RecoveryFeatures.md
---

# &#x20;RecoveryFeatures

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:44](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/request-subscription.ts#L44)

Utilities to assist in recovering from the error.

## Properties

### isHidden

```ts
isHidden: boolean;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:52](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/request-subscription.ts#L52)

Whether the browser reports that the tab is hidden.

***

### isOnline

```ts
isOnline: boolean;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:48](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/request-subscription.ts#L48)

Whether the browser reports that the network is online.

***

### retry

```ts
retry: () => Promise<void>;
```

Defined in: [warp-drive-packages/core/src/signals/request-subscription.ts:56](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/request-subscription.ts#L56)

Retries the request, reloading it from the server.

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
