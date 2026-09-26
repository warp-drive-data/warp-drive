---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/experiments/pagination/types/SharedPaginationContentFeatures.md
description: >-
  Experimental: the request status flags and controls, like `isRefreshing`,
  `refresh`, and `reload`, that `<Paginate />` yields to its content block in
  both modes.
---

&#x20;

# &#x20;SharedPaginationContentFeatures\<RT>

```ts
interface SharedPaginationContentFeatures<RT> {
  abort?: () => void;
  isHidden: boolean;
  isNavigating: boolean;
  isOnline: boolean;
  isRefreshing: boolean;
  latestRequest?: Future<RT>;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:819](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L819)

The content features available in both pagination modes: the state and
controls of the initial request.

## Extended by

* [`PagedPaginationContentFeatures`](PagedPaginationContentFeatures.md)
* [`InfinitePaginationContentFeatures`](InfinitePaginationContentFeatures.md)

## Type Parameters

### RT

`RT`

## Properties

### abort?

```ts
optional abort?: () => void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:833](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L833)

#### Returns

`void`

***

### isHidden

```ts
isHidden: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:821](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L821)

***

### isNavigating

```ts
isNavigating: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:830](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L830)

Whether a changed `@request` arg is currently resolving against the
loaded collection — e.g. a route-driven navigation (browser back button).
The existing content stays rendered while this is `true`; once the
request resolves it either becomes the active page (same collection) or
the component resets to the new collection.

***

### isOnline

```ts
isOnline: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:820](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L820)

***

### isRefreshing

```ts
isRefreshing: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:822](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L822)

***

### latestRequest?

```ts
optional latestRequest?: Future<RT>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:834](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L834)

***

### refresh

```ts
refresh: () => Promise<void>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:831](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L831)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>

***

### reload

```ts
reload: () => Promise<void>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:832](https://github.com/warp-drive-data/warp-drive/blob/5de9f22d0492ddb5538f446e288d7623ead973ae/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L832)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>
