---
url: /api/@warp-drive/core/types/request/variables/EnableHydration.md
---

# &#x20;EnableHydration

```ts
const EnableHydration: "___(unique) Symbol(EnableHydration)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:33](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/core/src/types/request.ts#L33)

A [RequestInfo](../types/RequestInfo.md) flag which, when set, signals to the store's
`instantiateRecord` hook that the resolved content should be hydrated
into reactive records rather than returned as raw data.
