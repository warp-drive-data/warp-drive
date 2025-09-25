---
order: 1
---

# Resource Schemas

Resource Schemas are the foundation of ***Warp*Drive**’s data layer.  
They describe the shape of your resources in a **plain object**, replacing the old `DS.Model` pattern with something universal, explicit, and future-ready.

Instead of writing classes with decorators, you define a schema with a `type`, an identity field, and a list of fields.  
This schema becomes the single source of truth for your resource — clear, predictable, and framework-agnostic.

They work anywhere: Ember, React, Node, or even without a DOM.

---

## Defining a Resource Schema

Here’s a simple example:

```ts [schemas/user.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'id', kind: '@id' },
    { name: 'firstName', kind: 'field' },
    { name: 'lastName', kind: 'field' },
    { name: 'email', kind: 'field' }
  ]
});
```

- `type` → the name of the resource (`user`)  
- `@id` → the identity field (primary key)  
- `field` → plain attributes  

This creates a contract between your API and your app — no hidden magic, no guessing.

---

## Registering a Schema in the Store

Schemas need to be registered with the store before use:

```ts [store/index.ts]
store.schema.registerResource({
  type: 'user',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'firstName', sourceKey: 'first-name' },
    { kind: 'field', name: 'lastName', sourceKey: 'last-name' },
    { kind: 'field', name: 'lastSeen', sourceKey: 'last-seen', type: 'date-time' },
    {
      kind: 'resource',
      name: 'bestFriend',
      sourceKey: 'best-friend',
      options: { async: false, inverse: null }
    },
    {
      kind: 'collection',
      name: 'pets',
      options: { async: false, inverse: null, polymorphic: true }
    },
  ]
});
```

- `identity` → defines the primary key  
- `sourceKey` → maps API field names to local names (`first-name` → `firstName`)  
- `resource` and `collection` → relationships to other schemas (belongsTo / hasMany)  
- `type` on a field → plugs in transforms for dates, URLs, decimals, etc.  

---

## Why Resource Schemas?

- 📖 **Explicit** — no hidden magic, everything is declared up front  
- 🔑 **Stable identity** — `type` + `@id` uniquely identify a record  
- 🔄 **Consistent** — API ↔ App data flow is schema-driven  
- ⚡ **Universal** — works in Ember, React, or any JS environment  

Schemas replace the “magical” behavior of models with explicit contracts between your API and your app.  
They’re lightweight, easy to reason about, and the foundation for WarpDrive’s traits, derivations, and transformations.

---
