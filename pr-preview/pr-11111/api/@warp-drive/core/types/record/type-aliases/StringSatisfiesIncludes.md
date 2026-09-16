---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/record/type-aliases/StringSatisfiesIncludes.md
---

# &#x20;StringSatisfiesIncludes\<T, SET>

```ts
type StringSatisfiesIncludes<T, SET> = _StringSatisfiesIncludes<T, SET, T>;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:209](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/record.ts#L209)

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
