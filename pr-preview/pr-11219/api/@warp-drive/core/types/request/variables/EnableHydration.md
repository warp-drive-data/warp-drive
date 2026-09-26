---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/types/request/variables/EnableHydration.md
---

# &#x20;EnableHydration

```ts
const EnableHydration: "___(unique) Symbol(EnableHydration)";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:33](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/types/request.ts#L33)

A [RequestInfo](../types/RequestInfo.md) flag which, when set, signals to the store's
`instantiateRecord` hook that the resolved content should be hydrated
into reactive records rather than returned as raw data.
