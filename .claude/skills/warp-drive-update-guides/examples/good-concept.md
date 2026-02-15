---
title: Understanding Records
order: 1
---

# Understanding Records

Records are the fundamental data objects in WarpDrive, representing individual entities from your backend.

## What are Records?

A record is an instance of a model class that:
- Represents a single resource from your API
- Tracks its own state and changes
- Provides methods for persistence operations
- Manages relationships with other records

## Record Lifecycle

Records go through several states:

### 1. New (Created)

```ts
const user = store.createRecord('user', { name: 'Alice' });
// user.isNew === true
```

### 2. Loading

```ts
const user = await store.findRecord('user', '1');
// Now loaded
```

### 3. Loaded

```ts
const user = await store.findRecord('user', '1');
// user.isLoaded === true
// user.isDirty === false
```

### 4. Dirty (Modified)

```ts {3}
const user = await store.findRecord('user', '1');

user.name = 'Alice Smith';
// user.isDirty === true
```

### 5. Saving

```ts
await user.save();
// After save, isDirty becomes false
```

### 6. Deleted

```ts
await user.destroy();
// user.isDeleted === true
```

## Record Identity

Each record has unique identity:
- **Type**: Model name (e.g., "user")
- **ID**: Unique identifier (e.g., "1")

::: code-group

```ts [String ID]
const user = await store.findRecord('user', '1');
```

```ts [Composite Key]
const identifier = { type: 'user', id: '1' };
const user = await store.findRecord(identifier);
```

:::

## Working with State

```ts
const user = await store.findRecord('user', '1');

user.isNew;      // false
user.isLoaded;   // true
user.isDirty;    // false
user.isSaving;   // false
user.isDeleted;  // false

user.name = 'Updated';
user.isDirty;    // true
```

### Reverting Changes

```ts
user.name = 'Temporary';
user.rollbackAttributes();
// Reverts to last saved value
```

## Best Practices

✅ **DO:**
- Check `isDirty` before saving
- Handle save errors
- Use `rollbackAttributes()` to cancel changes

❌ **DON'T:**
- Modify without saving
- Ignore errors
- Keep all records in memory

## Related Topics

- [Relationships](./relationships.md)
- [Queries](./queries.md)
- [Caching](./caching.md)
