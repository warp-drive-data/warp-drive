---
url: https://canary.warp-drive.io/api/@warp-drive/core/types/utils/types/Mutable.md
description: Utility type that strips `readonly` from every property of an object type.
---

# &#x20;Mutable\<T>

```ts
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
```

Defined in: [warp-drive-packages/core/src/types/utils.ts:29](https://github.com/warp-drive-data/warp-drive/blob/61394c6234e8cd5b736138b64ac29fdf3ec888d2/warp-drive-packages/core/src/types/utils.ts#L29)

Removes `readonly` from every property of `T`.

## Type Parameters

### T

`T`

## Example

```ts
interface Config { readonly host: string; }
type MutableConfig = Mutable<Config>; // { host: string }
```
