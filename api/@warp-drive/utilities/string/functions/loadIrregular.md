---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/string/functions/loadIrregular.md
description: >-
  Registers a list of singular and plural word pairs that `pluralize` and
  `singularize` map directly.
---

# &#x20;loadIrregular()&#x20;

```ts
function loadIrregular(irregularPairs: [string, string][]): void;
```

Defined in: [-private/string/inflect.ts:77](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/utilities/src/-private/string/inflect.ts#L77)

Marks a list of word pairs as irregular. Irregular words have unique
pluralization and singularization rules.

## Parameters

### irregularPairs

\[`string`, `string`]\[]

## Returns

`void`
