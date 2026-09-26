---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/types/cache/operations/types/UpdateResourceOperation.md
---

# &#x20;UpdateResourceOperation

```ts
interface UpdateResourceOperation extends Op {
  op: "update";
  record: PersistedResourceKey;
  value: ExistingResourceObject;
}
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:101](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/types/cache/operations.ts#L101)

Upserts (merges) new state for a resource

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "update";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:102](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/types/cache/operations.ts#L102)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:106](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/types/cache/operations.ts#L106)

The cache key for the resource

***

### value

```ts
value: ExistingResourceObject;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:110](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/types/cache/operations.ts#L110)

The new state to merge into the resource
