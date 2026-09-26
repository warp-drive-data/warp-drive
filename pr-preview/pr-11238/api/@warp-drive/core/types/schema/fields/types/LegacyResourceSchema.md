---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/schema/fields/types/LegacyResourceSchema.md
---

# &#x20;LegacyResourceSchema

```ts
interface LegacyResourceSchema {
  fields: LegacyModeFieldSchema[];
  identity: IdentityField;
  legacy: true;
  objectExtensions?: string[];
  traits?: string[];
  type: string;
}
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2318](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2318)

Represents a schema for a primary resource in LegacyMode

Primary resources are objects with a unique identity of their
own which may allow them to appear in relationships, or in multiple
response documents.

## Properties

### fields

```ts
fields: LegacyModeFieldSchema[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2362](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2362)

The fields that make up the shape of the resource

***

### identity

```ts
identity: IdentityField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2335](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2335)

This should be an IdentityField.

To maximize compatibility with Model where `id` was the
name of the identity field, we recommend using `{ kind: '@id', name: 'id' }`
for records in legacy mode, but this is not required.

***

### legacy

```ts
legacy: true;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2324](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2324)

A flag indicating that this is a legacy resource schema

***

### objectExtensions?

```ts
optional objectExtensions?: string[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2389](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2389)

::: warning ⚠️ Dangerous Feature Ahead
:::

Configures which extensions this resource should use.

Extensions are registered with the store's schema service
via [SchemaService.CAUTION\_MEGA\_DANGER\_ZONE\_registerExtension](../../schema-service/types/SchemaService.md#caution_mega_danger_zone_registerextension)

Extensions should only be used for temporary enhancements
to objects to support migrating away from deprecated patterns
like custom getters, computeds, and methods

***

### traits?

```ts
optional traits?: string[];
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2374](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2374)

A list of traits that this resource implements. The fields for these
traits should still be defined in the fields array.

Each trait should be a string that matches the `type` of another
resource schema. The trait can be abstract and reference a resource
type that is never defined as a schema.

***

### type

```ts
type: string;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2355](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2355)

The name of the schema

For cacheable resources, this should be the
primary resource type.

The names of object and resource schemas share
a single namespace and must not conflict.

We recommend a naming convention for object schemas
such as below for ensuring uniqueness:

* for globally shared objects: The pattern `$field:${KlassName}` e.g. `$field:AddressObject`
* for resource-specific objects: The pattern `$${ResourceKlassName}:$field:${KlassName}` e.g. `$User:$field:ReusableAddress`
* for inline objects: The pattern `$${ResourceKlassName}.${fieldPath}:$field:anonymous` e.g. `$User.shippingAddress:$field:anonymous`
