---
url: /pr-preview/pr-11111/api/@warp-drive/utilities/functions/filterEmpty.md
---

# &#x20;filterEmpty()

```ts
function filterEmpty(source): Record<string, Serializable>;
```

Defined in: [index.ts:628](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L628)

filter out keys of an object that have falsy values or point to empty arrays
returning a new object with only those keys that have truthy values / non-empty arrays

## Parameters

### source

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/type-aliases/Serializable.md)>

object to filter keys with empty values from

## Returns

[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, [`Serializable`](../../core/types/params/type-aliases/Serializable.md)>

A new object with the keys that contained empty values removed
