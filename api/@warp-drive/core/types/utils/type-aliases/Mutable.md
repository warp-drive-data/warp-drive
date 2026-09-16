---
url: /api/@warp-drive/core/types/utils/type-aliases/Mutable.md
---

# &#x20;Mutable\<T>

```ts
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
```

Defined in: [warp-drive-packages/core/src/types/utils.ts:21](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/utils.ts#L21)

Removes `readonly` from every property of `T`.

## Type Parameters

### T

`T`

## Example

```ts
interface Config { readonly host: string; }
type MutableConfig = Mutable<Config>; // { host: string }
```
