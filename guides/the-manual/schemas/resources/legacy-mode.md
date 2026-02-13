---
order: 1
---

# LegacyMode (recommended)

:::tip 💡 **Using LegacyMode is Our Current Recommendation for Most Apps**
In the upcoming V6 our recommendation will change to [PolarisMode (preview)](./polaris-mode.md)
:::

**LegacyMode** can be used to emulate the behaviors and capabilities of The `Model` class from `@warp-drive/legacy/model` that was the default way to define reactive objects with schemas for much of WarpDrive's history.

The advantage of using ReactiveResource in LegacyMode is that it allows adopting many newer schema-driven features before fully refactoring away from behaviors of Model that won't be supported by PolarisMode.

Because there is little-to-no distinction between the base features of Model and ReactiveResource in LegacyMode we refer to both of these approaches as LegacyMode. This mode remains the default experience in V5.

## Drawbacks of Using LegacyMode

:::danger **CAUTION**
Non-Ember Applications experience performance and bundle-size penalties if they use LegacyMode
:::

While WarpDrive's reactivity system ensures that even Model instances which extend from EmberObject are reactive in any framework, using `@warp-drive/legacy` necessitates including ember-source and Ember's reactivity system. This means non-Ember apps exploring WarpDrive will encounter a steep performance and bundle-size penalty if adopting LegacyMode. We recommend non-Ember applications wait
for PolarisMode to become recommended before adopting WarpDrive beyond experimental use cases.

## Feature Overview

In LegacyMode:

- records are mutable
- local changes immediately reflect app wide
- records have all the APIs of Model (references, state props, currentState, methods etc)
- limited reactivity for attribute fields (same as Model)
- the continued use of `@warp-drive/legacy` is required (though most imports from it can be removed)
- `async: true` relationships are supported (though we recommend transitioning to using them in [LinksMode](../../misc/links-mode.md))

### Configuration

LegacyMode works by defining a series of derived fields on a resource's schema that replicate the behaviors of Model from `@warp-drive/legacy/model` exactly. This is done by sharing the underlying implementation of these features that Model also uses, and thus is why `@warp-drive/legacy` remains
a requirement for use of LegacyMode.

If not using `useLegacyStore`, the derivations for these fields need to be registered with the schema service.

```ts
import { registerDerivations } from '@warp-drive/legacy/model/migration-support';

// ... somewhere with access to the store

registerDerivations(store.schema);
```

A common way to do this is to register the derivations while initializing the schema service.

```ts
import { Store } from '@warp-drive/core';
import { SchemaService } from '@warp-drive/core/reactive';
import { registerDerivations } from '@warp-drive/legacy/model/migration-support';

export default class AppStore extends Store {
  // ... other config

  createSchemaService() {
    const schema = new SchemaService();
    registerDerivations(schema);
    return schema;
  }
}

```

### Defining Legacy Schemas

Below we show both how to define a resource schema in LegacyMode and how to obtain a type
for a record that contains the types for these legacy fields and methods:

```ts
import { withDefaults, WithLegacy } from '@warp-drive/legacy/model/migration-support';
import { Type } from '@warp-drive/core/types/symbols';
import type { HasMany } from '@warp-drive/legacy/model';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'firstName', kind: 'attribute' },
    { name: 'lastName', kind: 'attribute' },
    { name: 'age', kind: 'attribute' },
    { name: 'friends',
      kind: 'hasMany',
      type: 'user',
      options: { inverse: 'friends', async: false }
    },
    { name: 'bestFriend',
      kind: 'belongsTo',
      type: 'user',
      options: { inverse: null, async: false }
    },
  ],
});

export type User = WithLegacy<{
  firstName: string;
  lastName: string;
  age: number;
  friends: HasMany<User>;
  bestFriend: User | null;
  [Type]: 'user';
}>
```

### Migration from Model to Schemas

In existing Ember apps relying on EmberData Model, see the [Migrating guides](../../../migrating/index.md) to adopt LegacyMode Schemas incrementally.
