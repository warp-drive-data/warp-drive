---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/types/LegacyResourceQuery.md
description: >-
  Legacy query object for `store.query` and `store.queryRecord` that the adapter
  turns into request query params, with an optional `include`.
---

# &#x20;LegacyResourceQuery

```ts
type LegacyResourceQuery = {
  [key: string]: Value | undefined;
  include?: string | string[];
};
```

Defined in: [warp-drive-packages/core/src/store/-types/q/store.ts:95](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/store/-types/q/store.ts#L95)

An opaque query object for `store.query()` and `store.queryRecord()`
that is passed as-is to the adapter, which is responsible for turning
it into request query parameters.

## Indexable

```ts
[key: string]: Value | undefined
```

## Properties

### include?

```ts
include?: string | string[];
```

Defined in: [warp-drive-packages/core/src/store/-types/q/store.ts:101](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/store/-types/q/store.ts#L101)

The names of relationships to load along with this query, used to
build the `include` query parameter for adapters (such as the
JSON:API adapter) that support it.
