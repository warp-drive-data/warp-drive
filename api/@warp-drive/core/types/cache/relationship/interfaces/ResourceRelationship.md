---
url: >-
  /api/@warp-drive/core/types/cache/relationship/interfaces/ResourceRelationship.md
---

# &#x20;ResourceRelationship\<T>

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:23](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/cache/relationship.ts#L23)

The stable-cache-key form of a `to-one` [relationship](../../../spec/json-api-raw/interfaces/SingleResourceRelationship.md).

Unlike [SingleResourceRelationship](../../../spec/json-api-raw/interfaces/SingleResourceRelationship.md), `data` is always in the
stable [ResourceKey](../../../identifier/type-aliases/ResourceKey.md) form rather than a raw resource identifier.

## Example

```ts
const relationship: ResourceRelationship = { data: resourceKey };
```

## Type Parameters

### T

`T` = [`ResourceKey`](../../../identifier/type-aliases/ResourceKey.md)

## Properties

### data?

```ts
optional data?: T | null;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:27](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/cache/relationship.ts#L27)

the related resource, or `null` if the relationship has no related resource

***

### links?

```ts
optional links?: Links;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:35](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/cache/relationship.ts#L35)

links related to the relationship

***

### meta?

```ts
optional meta?: ObjectValue;
```

Defined in: [warp-drive-packages/core/src/types/cache/relationship.ts:31](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/cache/relationship.ts#L31)

meta information about the relationship
