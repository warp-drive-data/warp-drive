---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/types/LegacyTrait.md
description: >-
  A named, reusable set of LegacyMode fields that resource schemas compose in
  via their `traits`, often to model polymorphic capabilities.
---

# &#x20;LegacyTrait

```ts
interface LegacyTrait {
  fields: LegacyModeFieldSchema[];
  mode: "legacy";
  name: string;
  traits?: string[];
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2536](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/schema/fields.ts#L2536)

A trait for use on a LegacyMode record.

Traits are reusable collections of fields that can be composed onto a
resource schema, often to describe a polymorphic capability shared by
multiple resource types.

## Properties

### fields

```ts
fields: LegacyModeFieldSchema[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2557](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/schema/fields.ts#L2557)

The fields that this trait contributes to any resource schema
that implements it.

***

### mode

```ts
mode: "legacy";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2551](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/schema/fields.ts#L2551)

The mode this trait is valid for use with.

A LegacyTrait may only be applied to LegacyMode resource schemas.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2544](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/schema/fields.ts#L2544)

The name of the trait.

This is the string referenced by a resource schema's `traits` array,
or by another trait's `traits` array, in order to make use of this
trait.

***

### traits?

```ts
optional traits?: string[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2565](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/schema/fields.ts#L2565)

A list of other traits that this trait itself implements.

As with a resource schema's `traits`, each entry should be a string
matching the `name` of another trait.
