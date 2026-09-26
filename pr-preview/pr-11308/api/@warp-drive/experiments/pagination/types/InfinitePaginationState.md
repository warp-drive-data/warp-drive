---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/experiments/pagination/types/InfinitePaginationState.md
description: >-
  Experimental: the pagination state `<Paginate />` yields in infinite mode,
  exposing the accumulated items and pages plus `loadNext` and `loadPrev` to
  extend them.
---

&#x20;

# &#x20;InfinitePaginationState\<RT = `unknown`, E = `unknown`>

```ts
interface InfinitePaginationState<RT = unknown, E = unknown> extends SharedPaginationState<RT, E> {
  readonly data: Iterable<ContentItem<RT>>;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
  loadNext: () => Promise<RT | null>;
  loadPrev: () => Promise<RT | null>;
  readonly nextRequest: Future<RT> | null;
  readonly pages: Iterable<Readonly<PageCache<RT, E>>>;
  readonly previousRequest: Future<RT> | null;
  readonly totalPages: number;
  adoptPage(request: Future<RT>): Promise<RT | null>;
}
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:263](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L263)

The infinite (accumulated view) surface of a [PaginationState](PaginationState.md): render
[data](PaginationState.md#data), grow it with
[loadNext](PaginationState.md#loadnext)/[loadPrev](PaginationState.md#loadprev).
This is what the `<Paginate />` component yields in `'infinite'` mode.

## Extends

* [`SharedPaginationState`](SharedPaginationState.md)<`RT`, `E`>

## Type Parameters

### RT

`RT` = `unknown`

### E

`E` = `unknown`

## Methods

### adoptPage()

```ts
adoptPage(request: Future<RT>): Promise<RT | null>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:235](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L235)

See [PaginationState.adoptPage](PaginationState.md#adoptpage).

#### Parameters

##### request

`Future`<`RT`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

#### Inherited from

[`SharedPaginationState`](SharedPaginationState.md).[`adoptPage`](SharedPaginationState.md#adoptpage)

## Properties

### data

```ts
readonly data: Iterable<ContentItem<RT>>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:265](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L265)

See [PaginationState.data](PaginationState.md#data).

***

### hasNext

```ts
readonly hasNext: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:269](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L269)

See [PaginationState.hasNext](PaginationState.md#hasnext).

***

### hasPrevious

```ts
readonly hasPrevious: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:271](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L271)

See [PaginationState.hasPrevious](PaginationState.md#hasprevious).

***

### loadNext

```ts
loadNext: () => Promise<RT | null>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:277](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L277)

See [PaginationState.loadNext](PaginationState.md#loadnext).

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

***

### loadPrev

```ts
loadPrev: () => Promise<RT | null>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:279](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L279)

See [PaginationState.loadPrev](PaginationState.md#loadprev).

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

***

### nextRequest

```ts
readonly nextRequest: Future<RT> | null;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:273](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L273)

See [PaginationState.nextRequest](PaginationState.md#nextrequest).

***

### pages

```ts
readonly pages: Iterable<Readonly<PageCache<RT, E>>>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:267](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L267)

See [PaginationState.pages](PaginationState.md#pages).

***

### previousRequest

```ts
readonly previousRequest: Future<RT> | null;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:275](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L275)

See [PaginationState.previousRequest](PaginationState.md#previousrequest).

***

### totalPages

```ts
readonly totalPages: number;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:233](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L233)

See [PaginationState.totalPages](PaginationState.md#totalpages).

#### Inherited from

[`SharedPaginationState`](SharedPaginationState.md).[`totalPages`](SharedPaginationState.md#totalpages)
