---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/utilities/string/functions/setMaxLRUCacheSize.md
description: >-
  Sets how many results the `camelize`, `underscore`, `capitalize`, and
  `dasherize` caches each keep (default 10,000).
---

# &#x20;setMaxLRUCacheSize()&#x20;

```ts
function setMaxLRUCacheSize(size: number): void;
```

Defined in: [-private/string/transform.ts:117](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/utilities/src/-private/string/transform.ts#L117)

Sets the maximum size of the LRUCache for all string transformation functions.
The default size is 10,000.

## Parameters

### size

`number`

## Returns

`void`
