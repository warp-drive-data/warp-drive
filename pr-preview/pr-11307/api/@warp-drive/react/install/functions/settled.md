---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/react/install/functions/settled.md
description: >-
  Resolves once all requests tracked by the React signal integration have
  settled, for use in tests; a no-op unless `TESTING` is enabled.
---

# &#x20;settled()

```ts
function settled(): Promise<void>;
```

Defined in: [install.ts:55](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/react/src/install.ts#L55)

Resolves once all pending requests started via WarpDrive's React signal
integration have settled. Only tracks requests while `TESTING` is enabled;
a no-op otherwise.

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
