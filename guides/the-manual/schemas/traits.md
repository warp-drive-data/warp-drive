---
order: 6
---

# Traits

A Trait is a reusable set of fields that can be shared across multiple ResourceSchemas.  
They help keep your schema definitions consistent and concise by avoiding repetition.

## Defining a Trait

```ts [schemas/traits/timestamps.ts]
export const Timestamps = {
  fields: [
    { name: 'createdAt', kind: 'field', type: 'date-time' },
    { name: 'updatedAt', kind: 'field', type: 'date-time' }
  ]
};
```

## Registering a Trait

A Trait must be registered with the schema service before it can be used:

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
  ],
  traits: ['timestamps']
});
```

By registering and reusing Traits, you can apply consistent sets of fields such as audit information, metadata, or tracking properties across different ResourceSchemas without duplicating code.
