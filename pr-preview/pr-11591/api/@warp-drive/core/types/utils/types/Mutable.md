---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/core/types/utils/types/Mutable.md
description: Utility type that strips `readonly` from every property of an object type.
---

# &#x20;Mutable\<T>

```ts
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
```

Defined in: [warp-drive-packages/core/src/types/utils.ts:29](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/core/src/types/utils.ts#L29)

Removes `readonly` from every property of `T`.

## Type Parameters

### T

`T`

## Example

```ts
interface Config { readonly host: string; }
type MutableConfig = Mutable<Config>; // { host: string }
```
