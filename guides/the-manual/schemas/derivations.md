---
order: 7
---

# Derivations

Derivations are computed fields inside a ResourceSchema.  
They allow you to define values that are derived from other fields or related resources, and they are automatically kept up to date when dependencies change.

## Creating a Derived Field

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

Here, `fullName` automatically updates whenever `firstName` or `lastName` changes.
With Derivations, you can keep logic about derived values in the schema itself, ensuring consistency and reactivity across your application.

### Dependency Updates in Action

```ts
const user = store.cache.peek('user', '1');
console.log(user.fullName);
user.firstName = 'Grace';
console.log(user.fullName); //Reactive (auto-updated)
```

## Built-in Derivations

WarpDrive ships with a few built-in derivations such as:

- [`concat`](https://canary.warp-drive.io/api/@warp-drive/utilities/derivations/namespaces/concat/#concat) for joining multiple fields
- More derivations can be found in the [API docs](https://canary.warp-drive.io/api/@warp-drive/utilities/derivations/)

## Custom Derivations

You can create your own derivations by providing a compute function and register using [registerDerivations](https://canary.warp-drive.io/api/@warp-drive/core/reactive/functions/registerDerivations#function-registerderivations).

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

## Registering a Custom Derivation

```ts [store/index.ts]
import { CanEditDerivation } from '../schemas/derivations/can-edit';

store.schema.registerDerivations([CanEditDerivation]);
```

Once registered, the `canEdit` derived field can be added to any ResourceSchema.

## Using a Custom Derivation in a ResourceSchema

```ts [schemas/user.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'id', kind: '@id' },
    { name: 'firstName', kind: 'field' },
    { name: 'permissions', kind: 'field' },
    { name: 'canEdit', kind: 'derived', type: 'canEdit' } // The type in the case of custom derivation should be the name used to register the derivation.
  ]
});
```

Now `user.canEdit` will reactively update whenever the `permissions` field changes.
