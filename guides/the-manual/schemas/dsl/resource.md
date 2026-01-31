---
title: Resources
order: 1
---

# Defining Resources

Define resource schemas using `@Resource` and `@field` decorators.

## Basic Usage

```ts
import { Resource, field, compileResourceSchemas } from '@warp-drive/core/schema-dsl';

@Resource
class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
}

const schemas = compileResourceSchemas([User]);
store.schema.registerResources(schemas);
```

## Custom Type Name

By default, the type is derived from the class name:

- `User` → `'user'`
- `UserProfile` → `'user-profile'`

Override it by passing a string:

```ts
@Resource('person')
class User {
  @field declare name: string;
}
```

## Field Options

Apply a transformation with `type`:

```ts
@field({ type: 'date-time' })
declare createdAt: Date;
```

Map to a different cache key with `sourceKey`:

```ts
@field({ sourceKey: 'email_address' })
declare email: string;
```

## Custom Identity

Use `@id` when your identity field isn't called `id`:

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

## Multiple Resources

```ts
@Resource
class User {
  @field declare name: string;
}

@Resource
class Post {
  @field declare title: string;
}

const schemas = compileResourceSchemas([User, Post]);
store.schema.registerResources(schemas);
```
