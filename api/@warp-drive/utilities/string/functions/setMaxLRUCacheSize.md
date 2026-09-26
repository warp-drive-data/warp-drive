---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/string/functions/setMaxLRUCacheSize.md
description: >-
  Sets how many results the `camelize`, `underscore`, `capitalize`, and
  `dasherize` caches each keep (default 10,000).
---

# &#x20;setMaxLRUCacheSize()&#x20;

```ts
function setMaxLRUCacheSize(size: number): void;
```

Defined in: [-private/string/transform.ts:117](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/utilities/src/-private/string/transform.ts#L117)

Sets the maximum size of the LRUCache for all string transformation functions.
The default size is 10,000.

## Parameters

### size

`number`

## Returns

`void`
