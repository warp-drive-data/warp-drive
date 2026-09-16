---
url: /api/@warp-drive/core/types/request/variables/EnableHydration.md
---

# &#x20;EnableHydration

```ts
const EnableHydration: "___(unique) Symbol(EnableHydration)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:33](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L33)

A [RequestInfo](../interfaces/RequestInfo.md) flag which, when set, signals to the store's
`instantiateRecord` hook that the resolved content should be hydrated
into reactive records rather than returned as raw data.
