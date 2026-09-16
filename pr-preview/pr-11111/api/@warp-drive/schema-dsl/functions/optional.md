---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/schema-dsl/functions/optional.md
---

# &#x20;optional()&#x20;

```ts
function optional(target, key): void;
```

Defined in: [fields/optional.ts:12](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/schema-dsl/src/fields/optional.ts#L12)

**`Decorator`**

Reserved for future compile-time type derivation (e.g. marking a field
optional in a resource's generated create variant type). Currently a
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
