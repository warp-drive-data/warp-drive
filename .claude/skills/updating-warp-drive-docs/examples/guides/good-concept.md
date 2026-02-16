---
title: Understanding Records
order: 1
---

# Understanding Records

Records are the fundamental data objects in WarpDrive, representing individual entities from your backend.

## What are Records?

A record is a reactive resource that:
- Represents a single resource from your API
- Automatically tracks state changes
- Provides reactive updates to UI components
- Manages relationships with other records through identifiers

## Record Lifecycle

Records go through several states managed by the RequestManager:

### 1. New (Created)

```ts
import { createRecord } from '@warp-drive/core';

const user = createRecord(store, 'user', { name: 'Alice' });
// Check state through cache
const state = store.cache.state(user);
// state.isNew === true
```

### 2. Loading

```ts
import { findRecord } from '@warp-drive/core';

const userResource = findRecord(store, 'user', '1');
const user = await userResource.request;
// Now loaded
```

### 3. Loaded

```ts
import { findRecord } from '@warp-drive/core';

const { content: user } = findRecord(store, 'user', '1');
const state = store.cache.state(user);
// state.isLoaded === true
// state.isDirty === false
```

### 4. Dirty (Modified)

```ts {3}
import { findRecord, updateRecord } from '@warp-drive/core';

const { content: user } = findRecord(store, 'user', '1');

// Use updateRecord to modify
updateRecord(store, user, { name: 'Alice Smith' });
const state = store.cache.state(user);
// state.isDirty === true
```

### 5. Saving

```ts
import { saveRecord } from '@warp-drive/core';

await saveRecord(store, user);
// After save, isDirty becomes false
```

### 6. Deleted

```ts
import { deleteRecord } from '@warp-drive/core';

await deleteRecord(store, user);
const state = store.cache.state(user);
// state.isDeleted === true
```

## Record Identity

Each record has unique identity using `StableRecordIdentifier`:
- **Type**: Resource type (e.g., "user")
- **ID**: Unique identifier (e.g., "1")
- **Lid**: Local identifier for client-side tracking

::: code-group

```ts [Using findRecord]
import { findRecord } from '@warp-drive/core';

const { content: user } = findRecord(store, 'user', '1');
```

```ts [Using Identifier]
import { findRecord } from '@warp-drive/core';
import type { StableRecordIdentifier } from '@warp-drive/core-types';

const identifier: StableRecordIdentifier = { type: 'user', id: '1' };
const { content: user } = findRecord(store, identifier);
```

:::

## Working with State

```ts
import { findRecord, updateRecord } from '@warp-drive/core';

const { content: user } = findRecord(store, 'user', '1');
const state = store.cache.state(user);

state.isNew;      // false
state.isLoaded;   // true
state.isDirty;    // false
state.isSaving;   // false
state.isDeleted;  // false

updateRecord(store, user, { name: 'Updated' });
const updatedState = store.cache.state(user);
updatedState.isDirty;    // true
```

### Reverting Changes

```ts
import { updateRecord } from '@warp-drive/core';

updateRecord(store, user, { name: 'Temporary' });
store.cache.rollbackAttributes(user);
// Reverts to last saved value
```

## Best Practices

✅ **DO:**
- Check `state.isDirty` via `store.cache.state()` before saving
- Handle save errors with proper error handling
- Use `store.cache.rollbackAttributes()` to cancel changes
- Use reactive resources with `findRecord()` for automatic UI updates
- Import functions from `@warp-drive/core` for type safety

❌ **DON'T:**
- Directly mutate record properties (use `updateRecord()` instead)
- Ignore errors from async operations
- Keep all records in memory indefinitely
- Use legacy `store.createRecord()` or `record.save()` patterns

## Related Topics

- [Relationships](./relationships.md)
- [Queries](./queries.md)
- [Caching](./caching.md)
