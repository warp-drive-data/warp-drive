---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/types/schema/fields/types/HashField.md
description: >-
  Field schema of kind `@hash` that computes a schema-object's identity from its
  cache data using a registered hash function.
---

# &#x20;HashField

```ts
interface HashField {
  kind: "@hash";
  name: string | null;
  options?: ObjectValue;
  type: string;
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:381](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/schema/fields.ts#L381)

Represents a specialized field whose computed value
will be used as the primary key of a schema-object
for serializability and comparison purposes.

This field functions similarly to derived fields in that
it is non-settable, derived state but differs in that
it is only able to compute off of cache state and is given
no access to a record instance.

This means that if a hashing function wants to compute its value
taking into account transformations and derivations it must
perform those itself.

A schema-array can declare its "key" value to be `@hash` if
the schema-objects it contains have such a field.

Only one hash field is permittable per schema-object, and
it should be placed in the `ResourceSchema`'s `@id` field
in place of an `IdentityField`.

## Properties

### kind

```ts
kind: "@hash";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:387](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/schema/fields.ts#L387)

The kind of field this is.

***

### name

```ts
name: string | null;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:398](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/schema/fields.ts#L398)

The name of the field that serves as the
hash for the resource.

Only required if access to this value by
the UI is desired, it can be `null` otherwise.

***

### options?

```ts
optional options?: ObjectValue;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:415](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/schema/fields.ts#L415)

Any options that should be provided to the hash
function.

***

### type

```ts
type: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:407](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/schema/fields.ts#L407)

The name of a function to run to compute the hash.
The function will only have access to the cached
data for the record.
