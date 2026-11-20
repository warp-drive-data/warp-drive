---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/legacy/adapter/rest/types/QueryState.md
description: >-
  Query params the legacy `RESTAdapter.buildQuery` adds to `findRecord` and
  `findAll` URLs, such as the `include` paths to sideload.
---

&#x20;

# &#x20;QueryState

```ts
type QueryState = {
  include?: unknown;
  since?: unknown;
};
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:58](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/legacy/src/adapter/rest.ts#L58)

The query params built by [buildQuery](../classes/RESTAdapter.md#buildquery) for a
`findAll`/`findRecord` request.

## Properties

### include?

```ts
include?: unknown;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:62](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/legacy/src/adapter/rest.ts#L62)

the relationship paths to sideload

***

### since?

```ts
since?: unknown;
```

Defined in: [warp-drive-packages/legacy/src/adapter/rest.ts:66](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/legacy/src/adapter/rest.ts#L66)

a value used to request only records updated since the given value
