---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/reactive/functions/instantiateRecord.md
---

# &#x20;instantiateRecord()

```ts
function instantiateRecord(
   store, 
   identifier, 
   createArgs?
): ReactiveResource;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/hooks.ts:21](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/reactive/-private/hooks.ts#L21)

The store's default `instantiateRecord` hook implementation, which
produces a [ReactiveResource](../interfaces/ReactiveResource.md) for `identifier` using the resource
schema registered for its type.

`createArgs` are only applied (via `Object.assign`) when the resource's
schema is `legacy`, matching the historical behavior of assigning initial
properties when creating a new legacy record.

## Parameters

### store

[`Store`](../../classes/Store.md)

### identifier

[`ResourceKey`](../../types/identifier/type-aliases/ResourceKey.md)

### createArgs?

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `unknown`>

## Returns

[`ReactiveResource`](../interfaces/ReactiveResource.md)
