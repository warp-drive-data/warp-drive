---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/utilities/string/functions/loadUncountable.md
description: >-
  Registers a list of words that `pluralize` and `singularize` should always
  return unchanged.
---

# &#x20;loadUncountable()&#x20;

```ts
function loadUncountable(uncountables: string[]): void;
```

Defined in: [-private/string/inflect.ts:44](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/utilities/src/-private/string/inflect.ts#L44)

Marks a list of words as uncountable. Uncountable words are not pluralized
or singularized.

## Parameters

### uncountables

`string`\[]

## Returns

`void`
