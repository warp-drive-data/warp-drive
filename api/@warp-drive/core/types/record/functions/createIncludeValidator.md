---
url: /api/@warp-drive/core/types/record/functions/createIncludeValidator.md
---

# &#x20;createIncludeValidator()

```ts
function createIncludeValidator<T>(): <U>(includes) => U;
```

Defined in: [warp-drive-packages/core/src/types/record.ts:225](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/record.ts#L225)

Creates a runtime validator function for comma-separated `include` strings,
ensuring at compile time that only valid paths for `T` (per [Includes](../type-aliases/Includes.md))
are supplied.

## Type Parameters

### T

`T` *extends* [`TypedRecordInstance`](../interfaces/TypedRecordInstance.md)

## Returns

<`U`>(`includes`) => `U`

## Example

```ts
import { createIncludeValidator } from '@warp-drive/core/types/record';

const userIncludesValidator = createIncludeValidator<User>;

userIncludesValidator('company,company.ceo,friends');
```
