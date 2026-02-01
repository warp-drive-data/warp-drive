---
title: Resources
order: 1
---

# Defining Resources

Use `@Resource` to define a resource schema and `@field` to define its fields.

```ts
import { Resource, field, registerSchemas } from '@warp-drive/schema-dsl';

@Resource
class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
}

// Register with your store
registerSchemas(store.schema, [User]);
```

## Type Name

The resource type is derived from the class name:

- `User` → `'user'`
- `UserProfile` → `'user-profile'`

Override with a string argument:

```ts
@Resource('person')
class User {
  @field declare name: string;
}
```

## Field Options

```ts
// Apply a transformation
@field({ type: 'date-time' })
declare createdAt: Date;

// Map to a different cache key
@field({ sourceKey: 'email_address' })
declare email: string;
```

## Custom Identity

Use `@id` when your identity field isn't `id`:

```ts
@Resource
class User {
  @id declare uuid: string;
  @field declare name: string;
}
```

## Legacy Mode

For apps using `@warp-drive/legacy/model`:

```ts
@Resource({ legacy: true })
class Post {
  @field declare title: string;
}
```
