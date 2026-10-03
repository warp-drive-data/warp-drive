---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/record/types/StringSatisfiesIncludes.md
description: >-
  Type utility that checks a comma-separated `include` string contains only
  paths from an allowed union, resolving to `never` otherwise.
---

# &#x20;StringSatisfiesIncludes\<T *extends* `string`, SET *extends* `string`>

```ts
type StringSatisfiesIncludes<T extends string, SET extends string> = _StringSatisfiesIncludes<T, SET, T>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:227](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/core/src/types/record.ts#L227)

Validates that the comma-separated-string `T` (e.g. `'company,company.ceo,friends'`)
only contains paths present in the union `SET` (typically [Includes](Includes.md)).

TypeScript cannot autocomplete against this type; prefer [createIncludeValidator](../functions/createIncludeValidator.md)
for a better development experience unless you are writing a similar wrapper utility.

## Type Parameters

### T

`T` *extends* `string`

### SET

`SET` *extends* `string`

## Example

```ts
import type { StringSatisfiesIncludes, Includes } from '@warp-drive/core/types/record';

const includes: StringSatisfiesIncludes<
  'company,company.ceo,friends',
  Includes<User>
> = 'company,company.ceo,friends';
```
