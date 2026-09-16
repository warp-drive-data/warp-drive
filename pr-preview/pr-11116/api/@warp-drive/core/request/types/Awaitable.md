---
url: /pr-preview/pr-11116/api/@warp-drive/core/request/types/Awaitable.md
---

# &#x20;Awaitable\<T, E>

```ts
type Awaitable<T, E> = object;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:13](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/request/-private/promise-cache.ts#L13)

The minimal, structural subset of the `Promise` interface required to be
cached and inspected by [setPromiseResult](../functions/setPromiseResult.md) / [getPromiseResult](../functions/getPromiseResult.md)
(and by `getPromiseState`). Anything that is at least `then`/`catch`/`finally`
"shaped" (including a real `Promise` or [Future](Future.md)) satisfies this.

## Type Parameters

### T

`T` = `unknown`

### E

`E` = `unknown`

## Properties

### catch

```ts
catch: (onRejected) => unknown;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:25](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/request/-private/promise-cache.ts#L25)

Registers a rejection handler, `Promise.prototype.catch`-style.

#### Parameters

##### onRejected

(`reason`) => `unknown`

#### Returns

`unknown`

***

### finally

```ts
finally: (onFinally) => unknown;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:31](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/request/-private/promise-cache.ts#L31)

Registers a handler run on settlement, `Promise.prototype.finally`-style.

#### Parameters

##### onFinally

() => `unknown`

#### Returns

`unknown`

***

### then

```ts
then: (onFulfilled, onRejected) => unknown;
```

Defined in: [warp-drive-packages/core/src/request/-private/promise-cache.ts:19](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/request/-private/promise-cache.ts#L19)

Registers fulfillment/rejection handlers, `Promise.prototype.then`-style.

#### Parameters

##### onFulfilled

(`value`) => `unknown`

##### onRejected

(`reason`) => `unknown`

#### Returns

`unknown`
