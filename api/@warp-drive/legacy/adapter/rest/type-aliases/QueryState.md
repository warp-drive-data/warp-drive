---
url: /api/@warp-drive/legacy/adapter/rest/type-aliases/QueryState.md
---

&#x20;

# &#x20;QueryState

```ts
type QueryState = object;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:50](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/adapter/rest.ts#L50)

The query params built by [buildQuery](../classes/RESTAdapter.md#buildquery) for a
`findAll`/`findRecord` request.

## Properties

### include?

```ts
optional include?: unknown;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:54](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/adapter/rest.ts#L54)

the relationship paths to sideload

***

### since?

```ts
optional since?: unknown;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:58](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/legacy/src/adapter/rest.ts#L58)

a value used to request only records updated since the given value
