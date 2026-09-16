---
url: /api/@warp-drive/core/types/type-aliases/LegacyResourceQuery.md
---

# &#x20;LegacyResourceQuery

```ts
type LegacyResourceQuery = object;
```

Defined in: [warp-drive-packages/core/src/store/-types/q/store.ts:81](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-types/q/store.ts#L81)

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
optional include?: string | string[];
```

Defined in: [warp-drive-packages/core/src/store/-types/q/store.ts:87](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-types/q/store.ts#L87)

The names of relationships to load along with this query, used to
build the `include` query parameter for adapters (such as the
JSON:API adapter) that support it.
