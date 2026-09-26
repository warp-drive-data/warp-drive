---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/utilities/string/functions/clearRules.md
description: >-
  Removes every inflection rule, including the defaults, and empties the
  `singularize` and `pluralize` caches.
---

# &#x20;clearRules()&#x20;

```ts
function clearRules(): void;
```

Defined in: [-private/string/inflect.ts:125](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/warp-drive-packages/utilities/src/-private/string/inflect.ts#L125)

Clears all inflection rules
and resets the caches for singularize and pluralize.

## Returns

`void`
