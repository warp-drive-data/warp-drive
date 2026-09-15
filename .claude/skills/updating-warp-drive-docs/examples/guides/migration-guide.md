---
title: Migrating from v4 to v5
order: 1
---

# Migrating from v4 to v5

This guide helps you upgrade from WarpDrive v4.x to v5.0.

## Overview

Version 4.0 introduces several breaking changes focused on improving type safety, consistency, and async handling.

## Breaking Changes

### Change 1: Reactive Resources and Request Management

All record operations now use reactive resources that automatically update your UI.

**Old way (v4):**
```ts
const user = store.findRecord('user', id);
// Synchronous access (could be incomplete)
```

**New way (v5):**
```ts
import { findRecord } from '@warp-drive/core';

// Access reactive content directly
const { content: user } = findRecord(store, 'user', id);
// Reactive - automatically updates when data changes

// Or await the full request
const userResource = findRecord(store, 'user', id);
const user = await userResource.request;
// Properly awaited, guaranteed to be loaded
```

**Why:** Reactive resources provide automatic UI updates and better separation between loading state and content access.

**Migration steps:**
1. Import `findRecord` from `@warp-drive/core`
2. Destructure `content` for immediate reactive access, or `await` the `request` property
3. Ensure parent functions are marked `async` when awaiting
4. Add proper error handling with try/catch

### Change 2: Schema-Driven Resource Definition

Model decorators have been replaced with schema-driven resource definitions for better performance and type safety.

**Old way (v4):**
```ts
import { attr, belongsTo } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
  @attr('date') createdAt;
  @belongsTo('account') account;
}
```

**New way (v5) - Schema-Based:**
```ts
import type { SchemaService } from '@warp-drive/core-types/schema';
import type { ResourceSchema } from '@warp-drive/core-types/schema/concepts';

// Define schema
const UserSchema: ResourceSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    { name: 'name', kind: 'attribute', type: 'string' },
    { name: 'createdAt', kind: 'attribute', type: 'date' },
    { name: 'account', kind: 'belongsTo', type: 'account' }
  ]
};

// Register with schema service
class MySchemaService implements SchemaService {
  schemas = new Map([['user', UserSchema]]);

  resource(type: string) {
    return this.schemas.get(type);
  }
}
```

**Alternative (v5) - Legacy Decorator Compatibility:**
```ts
import { Model, attr, belongsTo } from '@warp-drive/model';

export class User extends Model {
  @attr declare name: string;
  @attr declare createdAt: Date;
  @belongsTo declare account: Account;
}
```

**Why:** Schema-driven approach provides better performance, type safety, and enables treeshaking. Decorator support maintained for gradual migration.

**Migration steps:**
1. **Preferred:** Define schemas using `ResourceSchema` and register with `SchemaService`
2. **Alternative:** Update import paths from `@ember-data/*` to `@warp-drive/*`
3. Add `declare` keyword to all decorated properties
4. Add explicit type annotations
5. Remove decorator type arguments (e.g., `@attr('string')` → `@attr`)

### Change 3: Request Management and Store Configuration

Store initialization now uses RequestManager for flexible, composable request handling.

**Old way (v4):**
```ts
import Store from '@ember-data/store';

const store = Store.create({
  adapter: 'application'
});
```

**New way (v5):**
```ts
import { Store } from '@warp-drive/core';
import RequestManager from '@warp-drive/request';
import Fetch from '@warp-drive/request/fetch';
import { CacheHandler } from '@ember-data/json-api/request';

// Create RequestManager with handlers
const manager = new RequestManager();
manager.use([Fetch, CacheHandler]);

// Create store with RequestManager
const store = new Store({
  requestManager: manager
});

// Use legacy adapter pattern (compatibility)
import { LegacyNetworkHandler } from '@ember-data/legacy-compat';
const legacyManager = new RequestManager();
legacyManager.use([LegacyNetworkHandler]);
```

**Why:** RequestManager provides composable request handling, middleware-like handlers, and better control over caching and network requests.

**Migration steps:**
1. Create a `RequestManager` instance
2. Register handlers with `manager.use()` (e.g., `Fetch`, `CacheHandler`)
3. Pass `requestManager` to `Store` constructor
4. For gradual migration, use `LegacyNetworkHandler` to maintain adapter compatibility
5. Update configuration options

## Deprecated APIs

### Removed: `model.save()` instance method

**Old:**
```ts
user.name = 'Updated';
await user.save();
```

**New:**
```ts
import { updateRecord, saveRecord } from '@warp-drive/core';

// Update the record
updateRecord(store, user, { name: 'Updated' });

// Save using functional API
await saveRecord(store, user);
```

**Why:** Functional API provides better composability and reduces instance method bloat.

## New Features in v5

### Reactive Resources

```ts
import { findRecord, query } from '@warp-drive/core';

// Reactive resources automatically update UI
const userResource = findRecord(store, 'user', '1');
const { content: user, isSuccess, isError } = userResource;

// Access loading state
if (userResource.isPending) {
  // Show loading state
}

// Query returns reactive collection
const usersResource = query(store, 'user', { filter: { active: true } });
const users = usersResource.content;
```

### Request Management

```ts
import RequestManager from '@warp-drive/request';

// Composable request handlers
const manager = new RequestManager();
manager.use([
  CacheHandler,
  Fetch,
  CustomAuthHandler
]);

// Direct request API
const response = await manager.request({
  url: '/api/users/1',
  method: 'GET'
});
```

### Schema-Driven Architecture

```ts
import type { ResourceSchema } from '@warp-drive/core-types/schema/concepts';

// Define schemas without classes
const UserSchema: ResourceSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    { name: 'name', kind: 'attribute', type: 'string' },
    { name: 'email', kind: 'attribute', type: 'string' }
  ]
};

// Enables better treeshaking and performance
```

### Improved Cache Control

```ts
import { peekRecord } from '@warp-drive/core';

// Explicit cache management
const identifier = store.identifierCache.getOrCreateRecordIdentifier({
  type: 'user',
  id: '1'
});

store.cache.put({
  content: {
    type: 'user',
    id: '1',
    attributes: { name: 'Alice' }
  }
});

const cached = peekRecord(store, identifier);
```

### Better Type Inference

```ts
import { findRecord } from '@warp-drive/core';

// TypeScript now infers the correct type
const { content: user } = findRecord(store, 'user', '1');
// user is properly typed based on schema
```

## Migration Checklist

- [ ] Update all package imports from `@ember-data/*` to `@warp-drive/*`
- [ ] Import functional APIs from `@warp-drive/core` (`findRecord`, `updateRecord`, `saveRecord`, etc.)
- [ ] Replace `store.findRecord()` with reactive `findRecord(store, type, id)`
- [ ] Replace instance methods like `model.save()` with `saveRecord(store, model)`
- [ ] Replace direct property mutation with `updateRecord(store, model, changes)`
- [ ] Set up `RequestManager` with appropriate handlers
- [ ] Consider migrating to schema-driven resource definitions
- [ ] Replace `store.peekRecord()` with `peekRecord()` functional API
- [ ] Add `declare` keyword to model properties (if using decorators)
- [ ] Add explicit type annotations
- [ ] Update tests to handle reactive resources and async operations
- [ ] Run full test suite

## Getting Help

If you encounter issues:
- Check the [breaking changes guide](./breaking-changes.md)
- Review the [API documentation](../api/)
- Ask on [Discord](https://discord.gg/PHBbnWJx5S)

## Related Topics

- [Store API](../api/store/)
- [Model API](../api/model/)
- [Breaking Changes](./breaking-changes.md)
