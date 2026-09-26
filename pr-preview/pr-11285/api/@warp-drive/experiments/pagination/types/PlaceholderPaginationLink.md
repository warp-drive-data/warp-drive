---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/experiments/pagination/types/PlaceholderPaginationLink.md
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

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:597](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L597)

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

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:603](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L603)

The inclusive `[start, end]` page-number range of not-yet-loaded pages this
placeholder stands in for.

***

### isReal

```ts
readonly isReal: false;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:598](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L598)

***

### text

```ts
text: string;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:604](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L604)

### distanceFromActiveIndex

#### Get Signature

```ts
get distanceFromActiveIndex(): number;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:612](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L612)

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

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:607](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L607)

The number of pages this placeholder covers.

##### Returns

`number`
