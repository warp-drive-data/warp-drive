---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/string/functions/clearRules.md
description: >-
  Removes every inflection rule, including the defaults, and empties the
  `singularize` and `pluralize` caches.
---

# &#x20;clearRules()&#x20;

```ts
function clearRules(): void;
```

Defined in: [-private/string/inflect.ts:125](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/utilities/src/-private/string/inflect.ts#L125)

Clears all inflection rules
and resets the caches for singularize and pluralize.

## Returns

`void`
