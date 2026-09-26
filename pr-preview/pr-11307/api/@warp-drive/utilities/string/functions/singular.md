---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/utilities/string/functions/singular.md
description: >-
  Adds a regex and replacement rule that `singularize` checks before all
  existing singular rules.
---

# &#x20;singular()&#x20;

```ts
function singular(regex: RegExp, string: string): void;
```

Defined in: [-private/string/inflect.ts:194](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/utilities/src/-private/string/inflect.ts#L194)

Adds a singularization rule.

## Parameters

### regex

[`RegExp`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

### string

`string`

## Returns

`void`
