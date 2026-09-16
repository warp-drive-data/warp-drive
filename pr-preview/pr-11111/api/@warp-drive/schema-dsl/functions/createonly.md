---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/createonly.md
---

# &#x20;createonly()&#x20;

```ts
function createonly(target, key): void;
```

Defined in: [fields/createonly.ts:12](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/createonly.ts#L12)

**`Decorator`**

Reserved for future compile-time type derivation (e.g. omitting a field
from a resource's generated edit variant type). Currently a no-op: it has
no effect on the compiled `JSON` schema, and stacking it with a field
decorator like [field](field.md) changes nothing about that field's compiled
output.

## Parameters

### target

`object`

### key

`string`

## Returns

`void`
