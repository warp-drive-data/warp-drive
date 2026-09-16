---
url: /pr-preview/pr-11087/api/@warp-drive/legacy/model/functions/modelFor.md
---

&#x20;

# &#x20;modelFor()

## Call Signature

```ts
function modelFor<T>(type): void | typeof Model;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:71](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/legacy/src/model/-private/hooks.ts#L71)

The `modelFor` implementation for use with `Model`, exposed on the store
as `store.modelFor(type)` when the store is configured to use `Model`.
Returns the `Model` subclass registered for the given type, if any.

### Type Parameters

#### T

`T`

### Parameters

#### type

[`TypeFromInstance`](../../../core/types/record/type-aliases/TypeFromInstance.md)<`T`>

### Returns

`void` | *typeof* [`Model`](../classes/Model.md)

## Call Signature

```ts
function modelFor(type): void | typeof Model;
```

Defined in: [warp-drive-packages/legacy/src/model/-private/hooks.ts:77](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/legacy/src/model/-private/hooks.ts#L77)

Overload accepting a raw type string instead of a typed record instance.

### Parameters

#### type

`string`

### Returns

`void` | *typeof* [`Model`](../classes/Model.md)
