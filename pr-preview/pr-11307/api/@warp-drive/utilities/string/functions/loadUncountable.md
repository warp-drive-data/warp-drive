---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/utilities/string/functions/loadUncountable.md
description: >-
  Registers a list of words that `pluralize` and `singularize` should always
  return unchanged.
---

# &#x20;loadUncountable()&#x20;

```ts
function loadUncountable(uncountables: string[]): void;
```

Defined in: [-private/string/inflect.ts:44](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/utilities/src/-private/string/inflect.ts#L44)

Marks a list of words as uncountable. Uncountable words are not pluralized
or singularized.

## Parameters

### uncountables

`string`\[]

## Returns

`void`
