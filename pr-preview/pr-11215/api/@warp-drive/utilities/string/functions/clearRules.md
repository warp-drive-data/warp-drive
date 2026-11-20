---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/utilities/string/functions/clearRules.md
description: >-
  Removes every inflection rule, including the defaults, and empties the
  `singularize` and `pluralize` caches.
---

# &#x20;clearRules()&#x20;

```ts
function clearRules(): void;
```

Defined in: [-private/string/inflect.ts:125](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/utilities/src/-private/string/inflect.ts#L125)

Clears all inflection rules
and resets the caches for singularize and pluralize.

## Returns

`void`
