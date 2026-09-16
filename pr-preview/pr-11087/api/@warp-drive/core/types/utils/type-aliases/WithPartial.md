---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/utils/type-aliases/WithPartial.md
---

# &#x20;WithPartial\<T, K>

```ts
type WithPartial<T, K> = Omit<T, K> & Partial<Pick<T, K>>;
```

Defined in: [warp-drive-packages/core/src/types/utils.ts:10](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/utils.ts#L10)

Makes the properties named in `K` optional on `T`, leaving the rest as-is.

## Type Parameters

### T

`T`

### K

`K` *extends* keyof `T`

## Example

```ts
interface User { id: string; name: string; }
type PartialName = WithPartial<User, 'name'>; // { id: string; name?: string }
```
