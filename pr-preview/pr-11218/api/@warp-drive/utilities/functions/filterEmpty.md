---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/utilities/functions/filterEmpty.md
---

# &#x20;filterEmpty()

```ts
function filterEmpty(source: Record<string, Serializable>): Record<string, Serializable>;
```

Defined in: [index.ts:628](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/utilities/src/index.ts#L628)

filter out keys of an object that have falsy values or point to empty arrays
returning a new object with only those keys that have truthy values / non-empty arrays

## Parameters

### source

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/types/Serializable.md)>

object to filter keys with empty values from

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/types/Serializable.md)>

A new object with the keys that contained empty values removed
