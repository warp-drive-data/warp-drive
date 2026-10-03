---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/types/schema/fields/types/ObjectAliasField.md
description: >-
  Field schema of kind `alias` for object schemas that exposes another
  non-relationship field's cache value under a new name.
---

# &#x20;ObjectAliasField

```ts
interface ObjectAliasField {
  kind: "alias";
  name: string;
  options: 
  | GenericField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField;
  type: null;
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:271](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L271)

A field that can be used to alias one key to another
key present in the cache version of the resource.

Unlike DerivedField, an AliasField may write to its
source when a record is in an editable mode.

AliasFields may utilize a transform, specified by type,
to pre/post process the field.

An AliasField may also specify a `kind` via options.
`kind` may be any other valid field kind other than

* `@hash`
* `@id`
* `@local`
* `derived`

This allows an AliasField to rename any field in the cache.

Alias fields are generally intended to be used to support migrating
between different schemas, though there are times where they are useful
as a form of advanced derivation when used with a transform. For instance,
an AliasField could be used to expose both a string and a Date version of the
same field, with both being capable of being written to.

## Properties

### kind

```ts
kind: "alias";
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:277](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L277)

The kind of field this is.

***

### name

```ts
name: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:284](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L284)

The name of the field.

***

### options

```ts
options: 
  | GenericField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:298](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L298)

The field def for which this is an alias.

***

### type

```ts
type: null;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:291](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L291)

Always null (for now)
