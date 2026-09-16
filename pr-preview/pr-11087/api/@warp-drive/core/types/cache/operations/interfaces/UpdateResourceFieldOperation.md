---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/cache/operations/interfaces/UpdateResourceFieldOperation.md
---

# &#x20;UpdateResourceFieldOperation

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:115](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/operations.ts#L115)

Replaces the state of a field with a new state

## Extends

* [`Op`](Op.md)

## Properties

### field

```ts
field: string;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:124](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/operations.ts#L124)

The name of the field to update

***

### op

```ts
op: "update";
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:116](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/operations.ts#L116)

The name of the [operation](Op.md)

#### Overrides

[`Op`](Op.md).[`op`](Op.md#op)

***

### record

```ts
record: PersistedResourceKey;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:120](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/operations.ts#L120)

The cache key for the resource

***

### value

```ts
value: Value;
```

Defined in: [warp-drive-packages/core/src/types/cache/operations.ts:128](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/cache/operations.ts#L128)

The new value for the field
