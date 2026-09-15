---
title: Building Your First WarpDrive App
order: 1
---

# Building Your First WarpDrive App

This tutorial walks through creating a simple application using WarpDrive to manage user data.

## Prerequisites

- Node.js 18 or higher
- Basic TypeScript knowledge
- Familiarity with async/await

## Step 1: Installation

```bash
npm install @warp-drive/core @warp-drive/request @warp-drive/core-types
```

::: tip
Use `pnpm` for faster installation and better dependency management.
:::

::: info Optional Packages
- `@warp-drive/model` - If using decorator-based models (legacy compatibility)
- `@ember-data/json-api` - For JSON:API support
:::

## Step 2: Set Up RequestManager and Store

```ts
import { Store } from '@warp-drive/core';
import RequestManager from '@warp-drive/request';
import Fetch from '@warp-drive/request/fetch';
import { CacheHandler } from '@ember-data/json-api/request';

// Create RequestManager with handlers
const manager = new RequestManager();
manager.use([Fetch, CacheHandler]);

// Create Store with RequestManager
const store = new Store({
  requestManager: manager
});
```

::: details Why RequestManager?
RequestManager provides a composable, middleware-like architecture for handling requests. Handlers can be chained to add functionality like caching, authentication, retry logic, and more.
:::

## Step 3: Define Your Schema

::: code-group

```ts [Schema-Based (Recommended)]
import type { ResourceSchema } from '@warp-drive/core-types/schema/concepts';
import type { SchemaService } from '@warp-drive/core-types/schema';

// Define the User schema
const UserSchema: ResourceSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    { name: 'name', kind: 'attribute', type: 'string' },
    { name: 'email', kind: 'attribute', type: 'string' }
  ]
};

// Create a schema service
class AppSchemaService implements SchemaService {
  schemas = new Map<string, ResourceSchema>([
    ['user', UserSchema]
  ]);

  resource(type: string) {
    return this.schemas.get(type);
  }
}

// Register with store
store.registerSchemaService(new AppSchemaService());
```

```ts [Decorator-Based (Legacy)]
import { Model, attr } from '@warp-drive/model';

export class User extends Model {
  @attr declare name: string;
  @attr declare email: string;
}
```

:::

::: tip Why Schema-Based?
Schema-based definitions provide better performance, enable treeshaking, and separate data structure from behavior. They're the recommended approach for new applications.
:::

## Step 4: Fetch Data

```ts
import { findRecord } from '@warp-drive/core';

// Using reactive resources (immediate access)
const { content: user } = findRecord(store, 'user', '1');
console.log(user.name);

// Or await the request for guaranteed loading
const userResource = findRecord(store, 'user', '1');
const user = await userResource.request;
console.log(user.name);
```

::: tip Reactive Resources
When you destructure `content`, the resource is reactive. In frameworks like Ember, your UI will automatically update when the data loads or changes.
:::

## Step 5: Update Data

```ts {5,8}
import { findRecord, updateRecord, saveRecord } from '@warp-drive/core';

const { content: user } = findRecord(store, 'user', '1');

// Update the record using updateRecord
updateRecord(store, user, { name: 'Alice Smith' });

// Save the changes
await saveRecord(store, user);
```

::: info Immutable Updates
Use `updateRecord()` instead of directly mutating properties. This ensures proper change tracking and enables features like time-travel debugging.
:::

## Complete Example

```ts
import { Store } from '@warp-drive/core';
import { findRecord, updateRecord, saveRecord } from '@warp-drive/core';
import RequestManager from '@warp-drive/request';
import Fetch from '@warp-drive/request/fetch';
import { CacheHandler } from '@ember-data/json-api/request';
import type { ResourceSchema } from '@warp-drive/core-types/schema/concepts';
import type { SchemaService } from '@warp-drive/core-types/schema';

// Define schema
const UserSchema: ResourceSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },
  fields: [
    { name: 'name', kind: 'attribute', type: 'string' },
    { name: 'email', kind: 'attribute', type: 'string' }
  ]
};

// Schema service
class AppSchemaService implements SchemaService {
  schemas = new Map([['user', UserSchema]]);
  resource(type: string) {
    return this.schemas.get(type);
  }
}

async function main() {
  // Set up RequestManager
  const manager = new RequestManager();
  manager.use([Fetch, CacheHandler]);

  // Create store
  const store = new Store({ requestManager: manager });
  store.registerSchemaService(new AppSchemaService());

  // Fetch user
  const { content: user } = findRecord(store, 'user', '1');
  await findRecord(store, 'user', '1').request; // Ensure loaded
  console.log(`Hello, ${user.name}!`);

  // Update user
  updateRecord(store, user, { email: 'new@example.com' });
  await saveRecord(store, user);
  console.log(`Updated email to ${user.email}`);
}

main();
```

::: details Breaking It Down
1. **RequestManager**: Sets up composable request handling
2. **Schema Service**: Defines data structure without classes
3. **Reactive Resources**: `findRecord()` returns reactive resource
4. **Functional Updates**: `updateRecord()` and `saveRecord()` for mutations
5. **Type Safety**: TypeScript infers types from schemas
:::

## Working with Loading States

Reactive resources provide built-in loading state management:

```ts
import { findRecord } from '@warp-drive/core';

const userResource = findRecord(store, 'user', '1');

// Check loading state
if (userResource.isPending) {
  console.log('Loading...');
}

if (userResource.isSuccess) {
  console.log('Loaded:', userResource.content);
}

if (userResource.isError) {
  console.error('Error:', userResource.error);
}
```

## Handling Errors

```ts
import { findRecord, saveRecord } from '@warp-drive/core';

try {
  const { content: user } = findRecord(store, 'user', '1');
  await findRecord(store, 'user', '1').request;

  updateRecord(store, user, { email: 'invalid' });
  await saveRecord(store, user);
} catch (error) {
  console.error('Save failed:', error);
}
```

## Next Steps

- [Understanding Reactive Resources](../concepts/resources.md)
- [Working with Relationships](../concepts/relationships.md)
- [Request Management & Handlers](../concepts/request-manager.md)
- [Caching Strategies](../concepts/caching.md)
- [Schema-Driven Architecture](../concepts/schemas.md)
