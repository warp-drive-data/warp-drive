# @warp-drive/core

:::tip 💡 TIP
**This is the foundational package for WarpDrive**.
:::

The core package provides all the universal basics: the Store, RequestManager, SchemaService, and reactive primitives for building data-driven applications with type-safe, reactive data management.

## Overview

`@warp-drive/core` is the foundational package of the WarpDrive ecosystem. It provides:

- **{@link Store}** - The central data store managing cache, schemas, and requests
- **{@link RequestManager}** - Flexible request pipeline with middleware-style handlers
- **{@link SchemaService}** - Schema registry for resources, derivations, transformations, and traits
- **Reactive Primitives** - Building blocks for creating reactive resources and objects
- **Cache Integration** - Pluggable cache architecture supporting different caching strategies

WarpDrive separates concerns between data management (Store, Cache), network requests (RequestManager), and schema definitions (SchemaService), giving you fine-grained control over each layer.

## Installation

```bash
npm install @warp-drive/core
```

Or with pnpm:

```bash
pnpm add @warp-drive/core
```

You'll also need a Cache implementation. Most apps should use {@link @warp-drive/json-api! | @warp-drive/json-api}:

```bash
npm install @warp-drive/json-api
```

## Quick Start

The fastest way to get started is with {@link useRecommendedStore}, which configures the Store with sensible defaults:

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export const Store = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    // Your resource schemas
  ]
});

// Create a store instance
const store = new Store();

// Use the store
const user = store.findRecord('user', '1');
```

## Key Concepts

### Store

The {@link Store} is the central hub for data management. It coordinates between the Cache, SchemaService, RequestManager, and reactive primitives.

### Cache

A Cache implementation (like {@link @warp-drive/json-api!JSONAPICache | JSONAPICache}) stores and manages your data. The cache deeply understands your data's structure, maintaining consistency within and across requests.

### RequestManager

The {@link RequestManager} handles all network requests through a composable middleware pipeline. Add custom {@link Handler | Handlers} for authentication, logging, retries, and more.

### Schemas

Schemas describe the structure of your resources, including fields, relationships, derivations, and transformations. Register schemas with the {@link SchemaService} to enable type-safe reactive data.

### Reactive Primitives

WarpDrive provides low-level reactive primitives ({@link instantiateRecord}, {@link teardownRecord}) for creating reactive resources and objects that automatically update when data changes.

## Common Patterns

### Basic Store Setup

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export const Store = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    {
      type: 'user',
      fields: [
        { name: 'name', kind: 'attribute' },
        { name: 'email', kind: 'attribute' },
        { name: 'posts', kind: 'hasMany', type: 'post' }
      ]
    }
  ]
});
```

### Advanced Store Setup with Custom Configuration

```ts
import {
  useRecommendedStore,
  DefaultCachePolicy,
  type StoreSetupOptions
} from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';
import { MyAuthHandler } from './handlers/auth';

const config: StoreSetupOptions<JSONAPICache> = {
  cache: JSONAPICache,

  // Custom cache policy
  policy: new DefaultCachePolicy({
    apiCacheHardExpires: 30 * 60 * 1000, // 30 minutes
    apiCacheSoftExpires: 2 * 60 * 1000,  // 2 minutes
    constraints: {
      headers: {
        'Cache-Control': true,
        'Expires': true
      }
    }
  }),

  // Custom request handlers
  handlers: [MyAuthHandler],

  // Register schemas
  schemas: [
    // ... your schemas
  ],

  // Register derivations
  derivations: [
    {
      name: 'fullName',
      type: 'user',
      options: {},
      compute(record, options, prop) {
        return `${record.firstName} ${record.lastName}`;
      }
    }
  ],

  // Register transformations
  transformations: [
    {
      name: 'date',
      hydrate(value) {
        return value ? new Date(value) : null;
      },
      serialize(value) {
        return value?.toISOString() ?? null;
      }
    }
  ]
};

export const Store = useRecommendedStore(config);
```

### Manual Store Setup

For maximum control, extend the {@link Store} class directly:

```ts
import {
  Store,
  RequestManager,
  Fetch,
  CacheHandler,
  SchemaService,
  instantiateRecord,
  teardownRecord
} from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export class AppStore extends Store {
  requestManager = new RequestManager()
    .use([Fetch])
    .useCache(CacheHandler);

  createSchemaService() {
    const schema = new SchemaService();
    // Register your schemas, derivations, etc.
    return schema;
  }

  createCache(capabilities) {
    return new JSONAPICache(capabilities);
  }

  instantiateRecord(key, createArgs) {
    return instantiateRecord(this, key, createArgs);
  }

  teardownRecord(record) {
    return teardownRecord(record);
  }
}
```

### Using the RequestManager Independently

The {@link RequestManager} can be used independently for flexible request handling:

```ts
import { RequestManager, Fetch } from '@warp-drive/core';

const manager = new RequestManager();
manager.use([
  // Add custom handlers
  MyAuthHandler,
  MyLoggingHandler,
  // Fetch must be last
  Fetch
]);

const response = await manager.request({
  url: '/api/users/1',
  method: 'GET'
});
```

### Working with Cache Keys

Use {@link recordIdentifierFor} (or its alias {@link cacheKeyFor}) to get stable identifiers for resources:

```ts
import { recordIdentifierFor } from '@warp-drive/core';

const user = store.peekRecord('user', '1');
const key = recordIdentifierFor(user);

// key is a stable ResourceKey object:
// { type: 'user', id: '1', lid: '@lid:user-1' }
```

### Managing Cache Keys

Configure how cache keys are generated and managed:

```ts
import {
  setIdentifierGenerationMethod,
  setIdentifierUpdateMethod,
  setIdentifierForgetMethod,
  setIdentifierResetMethod
} from '@warp-drive/core';

// Custom ID generation
setIdentifierGenerationMethod((data) => {
  return `${data.type}-${crypto.randomUUID()}`;
});

// Handle ID updates
setIdentifierUpdateMethod((identifier, data, operation) => {
  if (data.id && identifier.id !== data.id) {
    identifier.id = data.id;
  }
});
```

## API Overview

### Core Classes

- {@link Store} - Central data store
- {@link RequestManager} - Request pipeline manager
- {@link SchemaService} - Schema registry and management
- {@link CacheHandler} - Cache integration handler
- {@link DefaultCachePolicy} - Default cache expiration policy

### Configuration

- {@link useRecommendedStore} - Create a configured Store with recommended defaults
- {@link StoreSetupOptions} - Configuration options for useRecommendedStore
- {@link ConfiguredStore} - Type for Store configured with useRecommendedStore

### Request Management

- {@link Fetch} - Built-in fetch handler
- {@link Handler} - Handler interface for request middleware

### Reactive Primitives

- {@link instantiateRecord} - Create a reactive resource instance
- {@link teardownRecord} - Destroy a reactive resource instance
- {@link registerDerivations} - Register derivations with SchemaService

### Cache Keys

- {@link recordIdentifierFor} - Get stable identifier for a resource
- {@link cacheKeyFor} - Alias for recordIdentifierFor
- {@link setIdentifierGenerationMethod} - Configure ID generation
- {@link setIdentifierUpdateMethod} - Configure ID updates
- {@link setIdentifierForgetMethod} - Configure ID cleanup
- {@link setIdentifierResetMethod} - Configure ID reset
- {@link setKeyInfoForResource} - Set key information for a resource type

### Types

- {@link Cache} - Cache interface
- {@link CachePolicy} - Cache policy interface
- {@link ResourceKey} - Stable resource identifier
- {@link CacheCapabilitiesManager} - Cache capabilities interface
- {@link StoreRequestContext} - Store request context type
- {@link StoreRequestInput} - Store request input type
- {@link ReactiveDocument} - Reactive document type
- {@link DocumentCacheOperation} - Document cache operation type
- {@link CacheOperation} - Cache operation type
- {@link NotificationType} - Notification type enum

### Schema Types

- {@link PolarisResourceSchema} - Resource schema definition
- {@link ObjectSchema} - Object schema definition
- {@link Trait} - Schema trait definition
- {@link Derivation} - Derived field definition
- {@link Transformation} - Field transformation definition
- {@link HashFn} - Hash function for embedded objects

### Utilities

- {@link storeFor} - Get the store instance for a resource

### Deprecated

- {@link Document} - Use {@link ReactiveDocument} instead

## Configuration

### Cache Policy

Configure cache expiration behavior with {@link DefaultCachePolicy}:

```ts
import { DefaultCachePolicy } from '@warp-drive/core';

const policy = new DefaultCachePolicy({
  // Hard expiration: data is invalid and must be refetched
  apiCacheHardExpires: 15 * 60 * 1000, // 15 minutes

  // Soft expiration: data is stale but can be used while refetching
  apiCacheSoftExpires: 30 * 1000, // 30 seconds

  // Respect cache headers
  constraints: {
    headers: {
      'Cache-Control': true,
      'Expires': true,
      'X-WarpDrive-Expires': true
    }
  }
});
```

### Request Handlers

Add custom handlers to the request pipeline:

```ts
import type { Handler } from '@warp-drive/core';

const AuthHandler: Handler = {
  async request(context, next) {
    // Add auth header
    context.request.headers.set('Authorization', `Bearer ${getToken()}`);

    // Continue to next handler
    return next(context.request);
  }
};
```

## Integration with Other Packages

`@warp-drive/core` is designed to work seamlessly with the WarpDrive ecosystem:

- **{@link @warp-drive/json-api! | @warp-drive/json-api}** - JSON:API cache implementation (recommended)
- **{@link @warp-drive/ember! | @warp-drive/ember}** - Ember.js integration with reactive components
- **{@link @warp-drive/react! | @warp-drive/react}** - React integration with hooks
- **{@link @warp-drive/schema! | @warp-drive/schema}** - Schema compilation and validation tools

## Tips and Best Practices

::: tip Performance
Use {@link useRecommendedStore} for optimal defaults. The recommended configuration includes:
- Smart cache expiration balancing freshness and performance
- Efficient request handler pipeline
- Automatic schema registration and validation
:::

::: tip Schema Design
Define schemas for all your resource types. Schemas enable:
- Type-safe data access
- Automatic relationship management
- Derived fields computed from other fields
- Custom transformations for serialization
:::

::: warning Cache Selection
Most apps should use {@link @warp-drive/json-api!JSONAPICache | JSONAPICache}. It excels at:
- Cache consistency
- Relational and polymorphic data
- Information density
- Request normalization

Don't skip caching - it powers immutability, mutation management, and relational data understanding.
:::

::: warning Testing Mode
In test environments, {@link setLogging} and `getRuntimeConfig` are exposed globally as `setWarpDriveLogging` and `getWarpDriveRuntimeConfig` for debugging and configuration inspection.
:::

## Related Packages

- {@link @warp-drive/json-api! | @warp-drive/json-api} - JSON:API cache implementation (recommended for most apps)
- {@link @warp-drive/ember! | @warp-drive/ember} - Ember.js components and utilities
- {@link @warp-drive/react! | @warp-drive/react} - React hooks and utilities
- {@link @warp-drive/schema! | @warp-drive/schema} - Schema compilation and validation
- {@link @warp-drive/utilities! | @warp-drive/utilities} - Shared utilities

## Additional Resources

- [Getting Started Guide](/guides/getting-started)
- [Schema Guide](/guides/schemas)
- [Request Management Guide](/guides/requests)
- [Cache Guide](/guides/caching)
