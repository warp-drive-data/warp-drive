---
url: /pr-preview/pr-11087/api/@warp-drive/schema-dsl/functions/readonly.md
---

# &#x20;readonly()&#x20;

```ts
function readonly(target, key): void;
```

Defined in: [fields/readonly.ts:12](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/readonly.ts#L12)

**`Decorator`**

Reserved for future compile-time type derivation (e.g. omitting a field
from a resource's generated create/edit variant types). Currently a
no-op: it has no effect on the compiled `JSON` schema, and stacking it
with a field decorator like [field](field.md) changes nothing about that
field's compiled output.

## Parameters

### target

`object`

### key

`string`

## Returns

`void`
