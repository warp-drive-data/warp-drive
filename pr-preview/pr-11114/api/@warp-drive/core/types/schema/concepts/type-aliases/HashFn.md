---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/schema/concepts/type-aliases/HashFn.md
---

# &#x20;HashFn\<T>

```ts
type HashFn<T> = object & (data, options, prop) => string;
```

Defined in: [warp-drive-packages/core/src/types/schema/concepts.ts:74](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/schema/concepts.ts#L74)

A HashFn computes a stable string identity for an object from its
cache data, without access to a record instance.

HashFns back HashField, and are used to compute the `@hash`
identity of a schema-object, or to determine the resource type of a
polymorphic schema-object or schema-array member.

HashFns must be registered with the SchemaService via
`schema.registerHashFn(hashFn)` before use, keyed by the name
assigned to their [Type](../../../symbols/variables/Type.md) property.

## Type Declaration

### \_\_\_(unique) Symbol($type)

```ts
___(unique) Symbol($type): string;
```

The unique name this hash function is registered under.

## Type Parameters

### T

`T` *extends* `object` = `object`
