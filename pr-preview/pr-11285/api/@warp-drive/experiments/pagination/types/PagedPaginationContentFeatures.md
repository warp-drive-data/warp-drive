---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/experiments/pagination/types/PagedPaginationContentFeatures.md
---

&#x20;

# &#x20;PagedPaginationContentFeatures\<RT>

```ts
interface PagedPaginationContentFeatures<RT> extends SharedPaginationContentFeatures<RT> {
  abort?: () => void;
  isHidden: boolean;
  isNavigating: boolean;
  isOnline: boolean;
  isRefreshing: boolean;
  latestRequest?: Future<RT>;
  loadPage: (url: string) => Promise<RT | null>;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:794](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L794)

The content features yielded in `'paged'` mode: navigation happens by
loading a specific page.

## Extends

* [`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md)<`RT`>

## Type Parameters

### RT

`RT`

## Properties

### abort?

```ts
optional abort?: () => void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:787](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L787)

#### Returns

`void`

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`abort`](SharedPaginationContentFeatures.md#abort)

***

### isHidden

```ts
isHidden: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:775](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L775)

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`isHidden`](SharedPaginationContentFeatures.md#ishidden)

***

### isNavigating

```ts
isNavigating: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:784](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L784)

Whether a changed `@request` arg is currently resolving against the
loaded collection — e.g. a route-driven navigation (browser back button).
The existing content stays rendered while this is `true`; once the
request resolves it either becomes the active page (same collection) or
the component resets to the new collection.

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`isNavigating`](SharedPaginationContentFeatures.md#isnavigating)

***

### isOnline

```ts
isOnline: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:774](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L774)

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`isOnline`](SharedPaginationContentFeatures.md#isonline)

***

### isRefreshing

```ts
isRefreshing: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:776](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L776)

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`isRefreshing`](SharedPaginationContentFeatures.md#isrefreshing)

***

### latestRequest?

```ts
optional latestRequest?: Future<RT>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:788](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L788)

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`latestRequest`](SharedPaginationContentFeatures.md#latestrequest)

***

### loadPage

```ts
loadPage: (url: string) => Promise<RT | null>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:795](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L795)

#### Parameters

##### url

`string`

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

***

### refresh

```ts
refresh: () => Promise<void>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:785](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L785)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`refresh`](SharedPaginationContentFeatures.md#refresh)

***

### reload

```ts
reload: () => Promise<void>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:786](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L786)

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`>

#### Inherited from

[`SharedPaginationContentFeatures`](SharedPaginationContentFeatures.md).[`reload`](SharedPaginationContentFeatures.md#reload)
