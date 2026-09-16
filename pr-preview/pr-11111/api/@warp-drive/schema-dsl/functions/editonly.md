---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/editonly.md
---

# &#x20;editonly()&#x20;

```ts
function editonly(target, key): void;
```

Defined in: [fields/editonly.ts:12](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/fields/editonly.ts#L12)

**`Decorator`**

Reserved for future compile-time type derivation (e.g. omitting a field
from a resource's generated create variant type). Currently a no-op: it
has no effect on the compiled `JSON` schema, and stacking it with a field
decorator like [field](field.md) changes nothing about that field's compiled
output.

## Parameters

### target

`object`

### key

`string`

## Returns

`void`
