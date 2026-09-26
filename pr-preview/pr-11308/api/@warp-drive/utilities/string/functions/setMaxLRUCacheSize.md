---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/utilities/string/functions/setMaxLRUCacheSize.md
description: >-
  Sets how many results the `camelize`, `underscore`, `capitalize`, and
  `dasherize` caches each keep (default 10,000).
---

# &#x20;setMaxLRUCacheSize()&#x20;

```ts
function setMaxLRUCacheSize(size: number): void;
```

Defined in: [-private/string/transform.ts:117](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/utilities/src/-private/string/transform.ts#L117)

Sets the maximum size of the LRUCache for all string transformation functions.
The default size is 10,000.

## Parameters

### size

`number`

## Returns

`void`
