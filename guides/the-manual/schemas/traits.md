---
order: 5
---

# Traits

Traits are reusable groups of fields that you can include in multiple ResourceSchemas.  
They help keep schemas consistent and reduce duplication.

A Trait is defined as a plain object with fields, and then registered so it can be reused anywhere.

## Creating a Trait

```ts [schemas/traits/timestamps.ts]
export const Timestamps = {
  fields: [
    { name: 'createdAt', kind: 'field', type: 'date-time' },
    { name: 'updatedAt', kind: 'field', type: 'date-time' }
  ]
};
```

## Registering a Trait

Once defined, register the trait with the SchemaService using [registerTrait](https://canary.warp-drive.io/api/@warp-drive/core/types/schema/schema-service/interfaces/SchemaService#registertrait)

```ts [store/index.ts]
import { store } from './store';
import { Timestamps } from './schemas/traits/timestamps';

store.schema.registerTrait('timestamps', Timestamps);
```

## Using a Trait in a ResourceSchema

```ts [schemas/user.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'id', kind: '@id' },
    { name: 'name', kind: 'field' },
  ]
  traits: ['timestamps']
});
```

The `timestamps` Trait is now mixed into the `user` ResourceSchema.

## Reuse Example

Traits can be shared across multiple schemas:

```ts [schemas/post.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const PostSchema = withDefaults({
  type: 'post',
  fields: [
    { name: 'id', kind: '@id' },
    { name: 'title', kind: 'field' }
  ],
  traits: ['timestamps']
});
```

Both `UserSchema` and `PostSchema` now automatically include `createdAt` and `updatedAt`.

By registering and reusing Traits, you can apply consistent sets of fields such as audit information, metadata, or tracking properties across different ResourceSchemas without duplicating code.
