---
title: Store API Guide
order: 1
---

# Store API Guide

Comprehensive guide to the Store interface and its methods.

## Overview

The Store is the central hub for managing data in WarpDrive. It coordinates between your application, the cache, and your backend API.

## Creating a Store

```ts
import { Store } from '@warp-drive/core';
import { JSONAPIAdapter } from '@warp-drive/adapter';

const store = new Store({
  adapter: new JSONAPIAdapter({
    host: 'https://api.example.com',
    namespace: 'v1'
  })
});
```

## Core Methods

### findRecord()

Fetches a single record by type and ID.

**Signature:**
```ts
findRecord<T = unknown>(
  type: string,
  id: string,
  options?: FindRecordOptions
): Promise<T>
```

**Parameters:**
- `type` - The model type (e.g., 'user', 'post')
- `id` - The record's unique identifier
- `options` - Optional configuration

**Example:**
```ts
// Basic usage
const user = await store.findRecord('user', '1');

// With options
const user = await store.findRecord('user', '1', {
  reload: true,        // Force reload from server
  include: 'posts'     // Include related records
});
```

**Returns:** Promise resolving to the record

**Throws:**
- `NotFoundError` - Record doesn't exist
- `NetworkError` - Connection failed

---

### findAll()

Fetches all records of a given type.

**Signature:**
```ts
findAll<T = unknown>(
  type: string,
  options?: FindAllOptions
): Promise<T[]>
```

**Example:**
```ts
const users = await store.findAll('user');

// With filtering
const users = await store.findAll('user', {
  reload: true
});
```

**Returns:** Promise resolving to array of records

---

### query()

Queries records with custom parameters.

**Signature:**
```ts
query<T = unknown>(
  type: string,
  query: QueryParams,
  options?: QueryOptions
): Promise<T[]>
```

**Example:**
```ts
const activeUsers = await store.query('user', {
  filter: { status: 'active' },
  sort: 'name',
  page: { limit: 10, offset: 0 }
});
```

**Returns:** Promise resolving to array of matching records

---

### createRecord()

Creates a new record in the local cache.

**Signature:**
```ts
createRecord<T = unknown>(
  type: string,
  properties?: object
): T
```

**Example:**
```ts
const user = store.createRecord('user', {
  name: 'Alice',
  email: 'alice@example.com'
});

// Save to server
await user.save();
```

**Returns:** The new record (not yet persisted)

---

### deleteRecord()

Marks a record for deletion.

**Signature:**
```ts
deleteRecord(record: Model): void
```

**Example:**
```ts
const user = await store.findRecord('user', '1');
store.deleteRecord(user);

// Commit deletion
await user.save();
```

---

### peekRecord()

Synchronously retrieves a record from cache if it exists.

**Signature:**
```ts
peekRecord<T = unknown>(
  type: string,
  id: string
): T | null
```

**Example:**
```ts
const user = store.peekRecord('user', '1');
if (user) {
  console.log(user.name);
} else {
  // Not in cache, need to fetch
}
```

**Returns:** The record if in cache, otherwise `null`

---

### peekAll()

Synchronously retrieves all cached records of a type.

**Signature:**
```ts
peekAll<T = unknown>(type: string): T[]
```

**Example:**
```ts
const allCachedUsers = store.peekAll('user');
```

**Returns:** Array of cached records

## Advanced Methods

### request()

Low-level API for custom requests.

**Example:**
```ts
const response = await store.request({
  url: '/api/users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

### unloadRecord()

Removes a record from cache.

**Example:**
```ts
const user = store.peekRecord('user', '1');
if (user) {
  store.unloadRecord(user);
}
```

### unloadAll()

Removes all records of a type from cache.

**Example:**
```ts
store.unloadAll('user');
```

## Options Reference

### FindRecordOptions

```ts
interface FindRecordOptions {
  reload?: boolean;      // Force fetch from server
  backgroundReload?: boolean; // Fetch in background
  include?: string;      // Related resources to include
  adapterOptions?: object; // Adapter-specific options
}
```

### QueryOptions

```ts
interface QueryOptions {
  adapterOptions?: object;
  include?: string;
}
```

## Error Handling

```ts
import { NotFoundError, NetworkError } from '@warp-drive/core';

try {
  const user = await store.findRecord('user', '1');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('User not found');
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    throw error;
  }
}
```

## Best Practices

### ✅ DO:
- Use `findRecord()` for single resources
- Use `query()` for filtered collections
- Handle errors appropriately
- Unload unused records to free memory

### ❌ DON'T:
- Call `findAll()` on large datasets
- Ignore error handling
- Keep all records in cache indefinitely
- Use `peekRecord()` without checking for null

## Related Topics

- [Model API](../api/model/)
- [Adapter API](../api/adapter/)
- [Cache API](../api/cache/)
- [Query Patterns](../concepts/queries.md)
