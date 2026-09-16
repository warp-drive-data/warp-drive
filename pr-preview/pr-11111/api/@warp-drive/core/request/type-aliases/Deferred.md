---
url: /pr-preview/pr-11111/api/@warp-drive/core/request/type-aliases/Deferred.md
---

# &#x20;Deferred\<T>

```ts
type Deferred<T> = object;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:33](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/request/-private/types.ts#L33)

A promise paired with the `resolve`/`reject` callbacks that settle it,
allowing the promise to be created before the work that will settle it
has begun. See [createDeferred](../functions/createDeferred.md).

## Type Parameters

### T

`T`

## Methods

### reject()

```ts
reject(v): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:37](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/request/-private/types.ts#L37)

Reject [promise](#promise) with the given reason.

#### Parameters

##### v

`unknown`

#### Returns

`void`

***

### resolve()

```ts
resolve(v): void;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:35](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/request/-private/types.ts#L35)

Resolve [promise](#promise) with the given value.

#### Parameters

##### v

`T`

#### Returns

`void`

## Properties

### promise

```ts
promise: Promise<T>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:39](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/request/-private/types.ts#L39)

The promise controlled by [resolve](#resolve) and [reject](#reject).
