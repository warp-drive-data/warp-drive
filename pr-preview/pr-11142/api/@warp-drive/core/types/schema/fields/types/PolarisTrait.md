---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/schema/fields/types/PolarisTrait.md
---

# &#x20;PolarisTrait

```ts
interface PolarisTrait {
  fields: PolarisModeFieldSchema[];
  mode: "polaris";
  name: string;
  traits?: string[];
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2478](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/fields.ts#L2478)

A trait for use on a PolarisMode record.

Traits are reusable collections of fields that can be composed onto a
resource schema, often to describe a polymorphic capability shared by
multiple resource types.

## Properties

### fields

```ts
fields: PolarisModeFieldSchema[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2499](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/fields.ts#L2499)

The fields that this trait contributes to any resource schema
that implements it.

***

### mode

```ts
mode: "polaris";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2493](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/fields.ts#L2493)

The mode this trait is valid for use with.

A PolarisTrait may only be applied to PolarisMode resource schemas.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2486](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/fields.ts#L2486)

The name of the trait.

This is the string referenced by a resource schema's `traits` array,
or by another trait's `traits` array, in order to make use of this
trait.

***

### traits?

```ts
optional traits?: string[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2507](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/schema/fields.ts#L2507)

A list of other traits that this trait itself implements.

As with a resource schema's `traits`, each entry should be a string
matching the `name` of another trait.
