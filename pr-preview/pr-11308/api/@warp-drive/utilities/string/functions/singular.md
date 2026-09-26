---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/utilities/string/functions/singular.md
description: >-
  Adds a regex and replacement rule that `singularize` checks before all
  existing singular rules.
---

# &#x20;singular()&#x20;

```ts
function singular(regex: RegExp, string: string): void;
```

Defined in: [-private/string/inflect.ts:194](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/utilities/src/-private/string/inflect.ts#L194)

Adds a singularization rule.

## Parameters

### regex

[`RegExp`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

### string

`string`

## Returns

`void`
