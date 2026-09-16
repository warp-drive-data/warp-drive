---
url: /api/@warp-drive/schema-dsl/functions/ObjectSchema.md
---

# &#x20;ObjectSchema()

## Call Signature

```ts
function ObjectSchema(target): void;
```

Defined in: [entities/object-schema.ts:67](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L67)

**`Class Decorator`**

Marks a class as an [object schema](../../core/types/schema/fields/interfaces/ObjectSchema.md) — an
embedded structure with no independent identity of its own, for use as
the value of a [schemaObject](schemaObject.md) or [schemaArray](schemaArray.md) field.

The object's `type` is derived from the class name (dasherized) unless a
`type` string is passed explicitly. Its `identity` is `null` unless a
property is decorated with [hash](hash.md), in which case that compiled
[HashField](../../core/types/schema/fields/interfaces/HashField.md) becomes the identity.

Each decorated property on the class contributes one entry to the
compiled `fields` array, in declaration order.

### Parameters

#### target

`AnyConstructor`

### Returns

`void`

### Example

::: code-group

```ts [address.ts]
import { ObjectSchema, field } from '@warp-drive/schema-dsl';

@ObjectSchema
export class Address {
  @field declare street: string;
  @field declare city: string;
}
```

```json [compiled schema]
{
  "type": "address",
  "identity": null,
  "fields": [
    { "kind": "field", "name": "street" },
    { "kind": "field", "name": "city" }
  ]
}
```

:::

## Call Signature

```ts
function ObjectSchema(type, options?): (target) => void;
```

Defined in: [entities/object-schema.ts:68](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L68)

**`Class Decorator`**

Marks a class as an [object schema](../../core/types/schema/fields/interfaces/ObjectSchema.md) — an
embedded structure with no independent identity of its own, for use as
the value of a [schemaObject](schemaObject.md) or [schemaArray](schemaArray.md) field.

The object's `type` is derived from the class name (dasherized) unless a
`type` string is passed explicitly. Its `identity` is `null` unless a
property is decorated with [hash](hash.md), in which case that compiled
[HashField](../../core/types/schema/fields/interfaces/HashField.md) becomes the identity.

Each decorated property on the class contributes one entry to the
compiled `fields` array, in declaration order.

### Parameters

#### type

`string`

#### options?

[`ObjectSchemaOptions`](../interfaces/ObjectSchemaOptions.md)

### Returns

(`target`) => `void`

### Example

::: code-group

```ts [address.ts]
import { ObjectSchema, field } from '@warp-drive/schema-dsl';

@ObjectSchema
export class Address {
  @field declare street: string;
  @field declare city: string;
}
```

```json [compiled schema]
{
  "type": "address",
  "identity": null,
  "fields": [
    { "kind": "field", "name": "street" },
    { "kind": "field", "name": "city" }
  ]
}
```

:::

## Call Signature

```ts
function ObjectSchema(options): (target) => void;
```

Defined in: [entities/object-schema.ts:69](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L69)

**`Class Decorator`**

Marks a class as an [object schema](../../core/types/schema/fields/interfaces/ObjectSchema.md) — an
embedded structure with no independent identity of its own, for use as
the value of a [schemaObject](schemaObject.md) or [schemaArray](schemaArray.md) field.

The object's `type` is derived from the class name (dasherized) unless a
`type` string is passed explicitly. Its `identity` is `null` unless a
property is decorated with [hash](hash.md), in which case that compiled
[HashField](../../core/types/schema/fields/interfaces/HashField.md) becomes the identity.

Each decorated property on the class contributes one entry to the
compiled `fields` array, in declaration order.

### Parameters

#### options

[`ObjectSchemaOptions`](../interfaces/ObjectSchemaOptions.md)

### Returns

(`target`) => `void`

### Example

::: code-group

```ts [address.ts]
import { ObjectSchema, field } from '@warp-drive/schema-dsl';

@ObjectSchema
export class Address {
  @field declare street: string;
  @field declare city: string;
}
```

```json [compiled schema]
{
  "type": "address",
  "identity": null,
  "fields": [
    { "kind": "field", "name": "street" },
    { "kind": "field", "name": "city" }
  ]
}
```

:::
