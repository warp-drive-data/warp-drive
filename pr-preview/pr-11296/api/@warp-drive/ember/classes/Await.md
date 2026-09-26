---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@warp-drive/ember/classes/Await.md
description: >-
  Component that renders a pending, error or success block for the state of a
  promise or awaitable.
---

# &#x20;\<Await />

Defined in: [warp-drive-packages/ember/dist/index.d.ts:383](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/ember/dist/index.d.ts#L383)

The `<Await />` component allow you to utilize reactive control flow
for asynchronous states in your application.

Await is ideal for handling "boundaries", outside which some state is
still allowed to be unresolved and within which it MUST be resolved.

```gts
import { Await } from '@warp-drive/ember';

<template>
  <Await @promise={{@request}}>
    <:pending>
      <Spinner />
    </:pending>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:success as |result|>
      <h1>{{result.title}}</h1>
    </:success>
  </Await>
</template>
```

The `<Await />` component requires that error states are properly handled.

If no error block is provided and the promise rejects, the error will be
rethrown asynchronously (a tick after the render that observed the rejection)
instead of crashing the current render. It remains an uncaught error that
crash-reporting instrumentation can observe. Prefer providing an `<:error>`
block -- the `template-require-request-error-block` ESLint rule flags a missing
one statically.

## Extends

* `default`<`AwaitSignature`<`T`, `E`>>

## Type Parameters

### T

`T`

### E

`E`

## Constructors

### Constructor

```ts
new Await<T, E>(owner: Owner, args: {
  promise:   | Promise<T>
     | Awaitable<T, E>;
}): Await<T, E>;
```

Defined in: [node\_modules/.pnpm/@glimmer+component@2.1.1/node\_modules/@glimmer/component/dist/index.d.ts:389](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/node_modules/.pnpm/@glimmer+component@2.1.1/node_modules/@glimmer/component/dist/index.d.ts#L389)

#### Parameters

##### owner

`Owner`

##### args

###### promise

| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`T`>
| `Awaitable`<`T`, `E`>

#### Returns

`Await`<`T`, `E`>

#### Inherited from

```ts
Component<AwaitSignature<T, E>>.constructor
```

## Properties

### error

#### Get Signature

```ts
get error(): E;
```

Defined in: [warp-drive-packages/ember/dist/index.d.ts:389](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/ember/dist/index.d.ts#L389)

The rejection reason, once [state](#state) has errored.

##### Returns

`E`

***

### result

#### Get Signature

```ts
get result(): T;
```

Defined in: [warp-drive-packages/ember/dist/index.d.ts:392](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/ember/dist/index.d.ts#L392)

The resolved value, once [state](#state) has succeeded.

##### Returns

`T`

***

### state

#### Get Signature

```ts
get state(): Readonly<PromiseState<T, E>>;
```

Defined in: [warp-drive-packages/ember/dist/index.d.ts:386](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/ember/dist/index.d.ts#L386)

The reactive PromiseState for the awaited promise.

##### Returns

[`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)<`PromiseState`<`T`, `E`>>
