---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/experiments/pagination/types/PlaceholderPaginationLink.md
description: >-
  Experimental: a non-navigable gap marker in numbered pagination links,
  standing in for a range of not-yet-loaded pages, usually shown as an ellipsis.
---

&#x20;

# &#x20;PlaceholderPaginationLink&#x20;

```ts
interface PlaceholderPaginationLink {
  indexRange: [number, number];
  readonly isReal: false;
  text: string;
  get distanceFromActiveIndex(): number;
  get rangeSize(): number;
}
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:631](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L631)

**`Hideconstructor`**

A stand-in for a run of pages that have not been loaded yet, rendered as an
ellipsis between numbered links. It covers an [indexRange](#indexrange) rather than a
single page and has no page to navigate to.

```gts
<EachLink @pages={{pages}} as |state|>
  {{#each state.links as |link|}}
    {{#unless link.isReal}}
      <span title="{{link.rangeSize}} more pages">{{link.text}}</span>
    {{/unless}}
  {{/each}}
</EachLink>
```

## Properties

### indexRange

```ts
indexRange: [number, number];
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:637](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L637)

The inclusive `[start, end]` page-number range of not-yet-loaded pages this
placeholder stands in for.

***

### isReal

```ts
readonly isReal: false;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:632](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L632)

***

### text

```ts
text: string;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:638](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L638)

### distanceFromActiveIndex

#### Get Signature

```ts
get distanceFromActiveIndex(): number;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:646](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L646)

The distance between the active page and the nearest edge of this
placeholder's index range.

##### Returns

`number`

***

### rangeSize

#### Get Signature

```ts
get rangeSize(): number;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:641](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L641)

The number of pages this placeholder covers.

##### Returns

`number`
