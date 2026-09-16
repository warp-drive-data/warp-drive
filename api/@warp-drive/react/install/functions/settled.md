---
url: /api/@warp-drive/react/install/functions/settled.md
---

# &#x20;settled()

```ts
function settled(): Promise<void>;
```

Defined in: [install.ts:50](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/react/src/install.ts#L50)

Resolves once all pending requests started via WarpDrive's React signal
integration have settled. Only tracks requests while `TESTING` is enabled;
a no-op otherwise.

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
