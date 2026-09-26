---
url: >-
  /api/@warp-drive/core/types/cache/operations/interfaces/AddResourceOperation.md
---

# &#x20;AddResourceOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:87](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache/operations.ts#L87)

Adds a resource to the cache.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "add";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:88](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache/operations.ts#L88)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:92](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache/operations.ts#L92)

The cache key for the resource

***

### value

```ts
value: ExistingResourceObject;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:96](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache/operations.ts#L96)

The data for the resource
