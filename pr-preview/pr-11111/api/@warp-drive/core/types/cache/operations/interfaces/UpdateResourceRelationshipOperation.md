---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/cache/operations/interfaces/UpdateResourceRelationshipOperation.md
---

# &#x20;UpdateResourceRelationshipOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:133](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L133)

Replaces the state of a relationship with a new state

## Extends

* [`Op`](Op.md)

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:142](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L142)

The name of the relationship to update

***

### op

```ts
op: "update";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:134](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L134)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:138](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L138)

The cache key for the resource

***

### value

```ts
value: Relationship<PersistedResourceKey<string>>;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:146](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache/operations.ts#L146)

The new state for the relationship
