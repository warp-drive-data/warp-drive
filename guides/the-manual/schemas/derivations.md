---
order: 7
---

# Derivations

Derivations are computed fields inside a ResourceSchema.  
They allow you to define values that are derived from other fields or related resources, and they are automatically kept up to date when dependencies change.

## Defining a Custom Derivation

A custom Derivation can compute any value based on a resource and the cache.

```ts [schemas/derivations/can-edit.ts]
export const CanEditDerivation = {
  name: 'canEdit',
  kind: 'derived',
  type: 'boolean',
  compute(user, cache) {
    const permissions = cache.get(user, 'permissions');
    return Array.isArray(permissions) && permissions.includes('edit');
  }
};
```

## Registering a Derivation

Custom Derivations must be registered before use:

```ts [store/index.ts]
import { store } from './store';
import { CanEditDerivation } from './schemas/derivations/can-edit';

store.schema.registerDerivation(CanEditDerivation);
```

## Using Built-in Derivations

WarpDrive includes several built-in Derivations. For example, the `concat` Derivation lets you combine fields into a new value.  
See the [concat API docs](https://canary.warp-drive.io/api/@warp-drive/utilities/derivations/namespaces/concat/#concat) for details.

```ts [schemas/user.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'firstName', kind: 'field' },
    { name: 'lastName', kind: 'field' },
    {
      name: 'fullName',
      kind: 'derived',
      type: 'concat',
      options: { fields: ['firstName', 'lastName'], separator: ' ' }
    }
  ]
});
```

With Derivations, you can keep logic about derived values in the schema itself, ensuring consistency and reactivity across your application.
