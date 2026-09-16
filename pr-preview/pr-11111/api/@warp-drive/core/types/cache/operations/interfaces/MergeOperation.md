---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/cache/operations/interfaces/MergeOperation.md
---

# &#x20;MergeOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:45](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L45)

Occasionally the Store discovers that two previously
thought to be distinct resources refer to the same resource.

This operation will be performed, giving the Cache the chance
to cleanup and merge internal state as desired when this discovery
is made.

## Extends

* [`Op`](Op.md)

## Properties

### op

```ts
op: "mergeIdentifiers";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:46](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L46)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:51](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L51)

The stale [ResourceKey](../../../identifier/type-aliases/ResourceKey.md) that
the cache should eliminate in favor of [value](#value)

***

### value

```ts
value: ResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:56](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/cache/operations.ts#L56)

The kept [ResourceKey](../../../identifier/type-aliases/ResourceKey.md) that
the cache should also keep and merge [record](#record) into.
