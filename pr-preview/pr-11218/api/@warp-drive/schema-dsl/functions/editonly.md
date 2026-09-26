---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/schema-dsl/functions/editonly.md
---

# &#x20;editonly()&#x20;

```ts
function editonly(target: object, key: string): void;
```

Defined in: [fields/editonly.ts:12](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/editonly.ts#L12)

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
