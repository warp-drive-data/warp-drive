---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/cache/operations/types/AddResourceOperation.md
---

# &#x20;AddResourceOperation

```ts
interface AddResourceOperation extends Op {
  op: "add";
  record: PersistedResourceKey;
  value: ExistingResourceObject;
}
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:87](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/cache/operations.ts#L87)

Adds a resource to the cache.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "add";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:88](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/cache/operations.ts#L88)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:92](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/cache/operations.ts#L92)

The cache key for the resource

***

### value

```ts
value: ExistingResourceObject;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:96](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/cache/operations.ts#L96)

The data for the resource
