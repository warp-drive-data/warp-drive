---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/types/QueryOptions.md
---

# &#x20;QueryOptions

```ts
type QueryOptions = { [K in string | "adapterOptions"]?: K extends "adapterOptions" ? Record<string, unknown> : unknown };
```

Defined in: [warp-drive-packages/core/src/store/-types/q/store.ts:67](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/store/-types/q/store.ts#L67)

Options for `store.query()` and `store.queryRecord()`. Unlike
[LegacyResourceQuery](LegacyResourceQuery.md), these options are not sent to the server;
only `adapterOptions` is recognized by the store, and it is passed
through to `adapter.query`/`adapter.queryRecord` via the request snapshot.
