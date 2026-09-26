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

Defined in: [-private/string/inflect.ts:125](https://github.com/warp-drive-data/warp-drive/blob/726aa7e4e452d652019a28d42c4ea165f904b847/warp-drive-packages/utilities/src/-private/string/inflect.ts#L125)

Clears all inflection rules
and resets the caches for singularize and pluralize.

## Returns

`void`
