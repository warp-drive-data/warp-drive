---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11305/api/@warp-drive/core/types/cache/operations/types/UpdateResourceRelationshipOperation.md
description: >-
  Cache operation that replaces the remote state of one relationship on a
  persisted resource.
---

# &#x20;UpdateResourceRelationshipOperation

```ts
interface UpdateResourceRelationshipOperation extends Op {
  field: string;
  op: "update";
  record: PersistedResourceKey;
  value: Relationship<PersistedResourceKey<string>>;
}
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:155](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/cache/operations.ts#L155)

Replaces the state of a relationship with a new state

## Extends

* [`Op`](Op.md)

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:164](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/cache/operations.ts#L164)

The name of the relationship to update

***

### op

```ts
op: "update";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:156](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/cache/operations.ts#L156)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:160](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/cache/operations.ts#L160)

The cache key for the resource

***

### value

```ts
value: Relationship<PersistedResourceKey<string>>;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:168](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/cache/operations.ts#L168)

The new state for the relationship
