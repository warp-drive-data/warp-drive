---
title: "@Resource Decorator"
order: 1
---

# @Resource Decorator

The `@Resource` decorator marks a TypeScript class as a resource schema. When compiled, it produces a canonical `ResourceSchema` that can be registered with the store's schema service.

## Basic Usage

```ts
import { Resource, field, compileResourceSchemas } from '@warp-drive/core/schema-dsl';

@Resource
class User {
  @field declare firstName: string;
  @field declare lastName: string;
  @field declare email: string;
}

// Compile and register
const schemas = compileResourceSchemas([User]);
store.schema.registerResources(schemas);
```

This produces the equivalent of:

```ts
store.schema.registerResources([
  {
    type: 'user',
    identity: { kind: '@id', name: 'id' },
    fields: [
      { kind: 'derived', name: '$type', type: '@identity', options: { key: 'type' } },
      { kind: 'field', name: 'firstName' },
      { kind: 'field', name: 'lastName' },
      { kind: 'field', name: 'email' },
      { kind: 'derived', name: 'constructor', type: '@constructor' }
    ]
  }
]);
```

## Type Name Derivation

By default, the resource type is derived from the class name using dasherization:

| Class Name | Resource Type |
|------------|---------------|
| `User` | `'user'` |
| `UserProfile` | `'user-profile'` |
| `APIKey` | `'api-key'` |

You can override the type name by passing it as an argument:

```ts
@Resource('custom-user')
class User {
  @field declare name: string;
}
```

## Options

The decorator accepts an options object:

```ts
@Resource({ legacy: true })
class Post {
  @field declare title: string;
}
```

| Option | Type | Description |
|--------|------|-------------|
| `legacy` | `boolean` | Enable LegacyMode for compatibility with `@warp-drive/legacy/model` |
| `identityField` | `string` | Custom identity field name (default: `'id'`) |

You can combine a type name with options:

```ts
@Resource('blog-post', { legacy: true })
class Post {
  @field declare title: string;
}
```

## The @field Decorator

Use `@field` to define primitive value fields on your resource:

```ts
@Resource
class User {
  @field declare name: string;
  @field declare age: number;
  @field declare isActive: boolean;
}
```

### Field Options

```ts
@Resource
class User {
  // Transform the value (e.g., parse as Date)
  @field({ type: 'date-time' })
  declare createdAt: Date;

  // Map to a different key in the cache
  @field({ sourceKey: 'email_address' })
  declare email: string;
}
```

| Option | Type | Description |
|--------|------|-------------|
| `type` | `string` | Transform name (e.g., `'date-time'`, `'number'`) |
| `sourceKey` | `string` | Alternative name in the cache if different from property name |

## The @id Decorator

Use `@id` when your resource uses a non-standard identity field:

```ts
@Resource
class User {
  @id declare uuid: string;
  @field declare name: string;
}
```

This produces a schema with:

```ts
{
  identity: { kind: '@id', name: 'uuid' },
  // ...
}
```

## Compilation

The DSL metadata is compiled into canonical schemas using `compileResourceSchema` or `compileResourceSchemas`:

```ts
import { compileResourceSchema, compileResourceSchemas } from '@warp-drive/core/schema-dsl';

// Single class
const userSchema = compileResourceSchema(User);

// Multiple classes
const schemas = compileResourceSchemas([User, Post, Comment]);

// Register with the store
store.schema.registerResources(schemas);
```

### Compile Options

```ts
const schema = compileResourceSchema(User, {
  // Skip adding $type and constructor derived fields
  includeDefaults: false
});
```

## Legacy Mode

For Ember apps using `@warp-drive/legacy/model`, enable legacy mode:

```ts
@Resource({ legacy: true })
class Post {
  @field declare title: string;
  @field declare body: string;
}
```

Legacy mode:
- Marks the schema with `legacy: true`
- Skips the default `$type` and `constructor` derived fields
- Produces a `LegacyResourceSchema` instead of `PolarisResourceSchema`

## How It Works

The DSL follows a three-layer architecture:

1. **Authoring** - You write TypeScript classes with decorators
2. **Compilation** - `compileResourceSchema` transforms metadata into canonical schemas
3. **Runtime** - The store's schema service consumes the standard JSON schemas

The decorators store metadata on the class using WeakMaps. When you call `compileResourceSchema`, it reads this metadata and builds a `ResourceSchema` object that matches exactly what you would write by hand.

This separation means:
- The runtime never sees your classes, only the compiled schemas
- You can mix DSL-defined and hand-written schemas
- The output is standard JSON, portable and inspectable

## What's Next

The DSL currently supports `@Resource`, `@field`, and `@id`. Future additions will include:

- `@Object` for embedded object schemas
- `@Trait` for reusable field collections
- Relationship decorators (`@belongsTo`, `@hasMany`)
- `@derived` for computed fields

See the [Schema DSL Overview](./index.md) for the full roadmap.
