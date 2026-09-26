---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/functions/filterEmpty.md
description: >-
  Returns a copy of an object without keys whose values are `undefined`, `null`,
  empty strings, or empty arrays.
---

# &#x20;filterEmpty()

```ts
function filterEmpty(source: Record<string, Serializable>): Record<string, Serializable>;
```

Defined in: [index.ts:647](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/utilities/src/index.ts#L647)

filter out keys of an object that have falsy values or point to empty arrays
returning a new object with only those keys that have truthy values / non-empty arrays

## Parameters

### source

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/types/Serializable.md)>

object to filter keys with empty values from

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/types/Serializable.md)>

A new object with the keys that contained empty values removed
