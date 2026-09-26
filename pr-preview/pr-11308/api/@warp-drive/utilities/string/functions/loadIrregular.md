---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/utilities/string/functions/loadIrregular.md
description: >-
  Registers a list of singular and plural word pairs that `pluralize` and
  `singularize` map directly.
---

# &#x20;loadIrregular()&#x20;

```ts
function loadIrregular(irregularPairs: [string, string][]): void;
```

Defined in: [-private/string/inflect.ts:77](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/utilities/src/-private/string/inflect.ts#L77)

Marks a list of word pairs as irregular. Irregular words have unique
pluralization and singularization rules.

## Parameters

### irregularPairs

\[`string`, `string`]\[]

## Returns

`void`
