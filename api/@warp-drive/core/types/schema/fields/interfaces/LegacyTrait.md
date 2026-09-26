---
url: /api/@warp-drive/core/types/schema/fields/interfaces/LegacyTrait.md
---

# &#x20;LegacyTrait

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2459](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2459)

A trait for use on a LegacyMode record.

Traits are reusable collections of fields that can be composed onto a
resource schema, often to describe a polymorphic capability shared by
multiple resource types.

## Properties

### fields

```ts
fields: LegacyModeFieldSchema[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2480](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2480)

The fields that this trait contributes to any resource schema
that implements it.

***

### mode

```ts
mode: "legacy";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2474](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2474)

The mode this trait is valid for use with.

A LegacyTrait may only be applied to LegacyMode resource schemas.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2467](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2467)

The name of the trait.

This is the string referenced by a resource schema's `traits` array,
or by another trait's `traits` array, in order to make use of this
trait.

***

### traits?

```ts
optional traits?: string[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2488](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2488)

A list of other traits that this trait itself implements.

As with a resource schema's `traits`, each entry should be a string
matching the `name` of another trait.
