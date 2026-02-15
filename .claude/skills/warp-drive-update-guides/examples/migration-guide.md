---
title: Migrating from v3 to v4
order: 1
---

# Migrating from v3 to v4

This guide helps you upgrade from WarpDrive v3.x to v4.0.

## Overview

Version 4.0 introduces several breaking changes focused on improving type safety, consistency, and async handling.

## Breaking Changes

### Change 1: Async Record Operations

All record operations are now properly async.

**Old way (v3):**
```ts
const user = store.findRecord('user', id);
// Synchronous access (could be incomplete)
```

**New way (v4):**
```ts
const user = await store.findRecord('user', id);
// Properly awaited, guaranteed to be loaded
```

**Why:** Async operations are now properly awaited, ensuring data is loaded before access.

**Migration steps:**
1. Add `await` to all `findRecord()` calls
2. Ensure parent functions are marked `async`
3. Add proper error handling with try/catch

### Change 2: Model Definition Syntax

Model decorators have changed.

**Old way (v3):**
```ts
import { attr, belongsTo } from '@ember-data/model';

export default class User extends Model {
  @attr('string') name;
  @attr('date') createdAt;
  @belongsTo('account') account;
}
```

**New way (v4):**
```ts
import { Model, attr, belongsTo } from '@warp-drive/model';

export class User extends Model {
  @attr declare name: string;
  @attr declare createdAt: Date;
  @belongsTo declare account: Account;
}
```

**Why:** Better TypeScript support with explicit type declarations.

**Migration steps:**
1. Update import paths from `@ember-data/*` to `@warp-drive/*`
2. Add `declare` keyword to all decorated properties
3. Add explicit type annotations
4. Remove decorator type arguments (e.g., `@attr('string')` → `@attr`)

### Change 3: Store Configuration

Store initialization has changed.

**Old way (v3):**
```ts
import Store from '@ember-data/store';

const store = Store.create({
  adapter: 'application'
});
```

**New way (v4):**
```ts
import { Store } from '@warp-drive/core';

const store = new Store({
  adapter: new JSONAPIAdapter()
});
```

**Why:** More flexible instantiation and better tree-shaking.

**Migration steps:**
1. Change from `Store.create()` to `new Store()`
2. Instantiate adapters explicitly
3. Update configuration options

## Deprecated APIs

### Removed: `store.peekRecord()` synchronous access

**Old:**
```ts
const user = store.peekRecord('user', '1');
```

**New:**
```ts
const user = store.cache.peek('user', '1');
// Or use async:
const user = await store.findRecord('user', '1');
```

### Removed: `model.save()` return type

**Old:** Returned the saved model
**New:** Returns a promise that resolves to the model

## New Features in v4

### Improved Cache Control

```ts
// Explicit cache management
store.cache.put({
  type: 'user',
  id: '1',
  attributes: { name: 'Alice' }
});

const cached = store.cache.peek('user', '1');
```

### Better Type Inference

```ts
// TypeScript now infers the correct type
const user = await store.findRecord('user', '1');
// user is typed as User, not Model
```

## Migration Checklist

- [ ] Update all package imports from `@ember-data/*` to `@warp-drive/*`
- [ ] Add `await` to all record operations
- [ ] Add `declare` keyword to model properties
- [ ] Add explicit type annotations
- [ ] Update store instantiation
- [ ] Replace `peekRecord()` with cache API or async calls
- [ ] Update tests to handle async operations
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
