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
npm install @warp-drive/core @warp-drive/model
```

::: tip
Use `pnpm` for faster installation.
:::

## Step 2: Create a Store

```ts
import { Store } from '@warp-drive/core';

const store = new Store({
  adapter: 'json-api',
  debug: true
});
```

## Step 3: Define Your Model

::: code-group

```ts [TypeScript]
import { Model, attr } from '@warp-drive/model';

export class User extends Model {
  @attr declare name: string;
  @attr declare email: string;
}
```

```js [JavaScript]
import { Model, attr } from '@warp-drive/model';

export class User extends Model {
  @attr name;
  @attr email;
}
```

:::

## Step 4: Fetch Data

```ts
const user = await store.findRecord('user', '1');
console.log(user.name);
```

## Step 5: Update Data

```ts {3,4}
const user = await store.findRecord('user', '1');

user.name = 'Alice Smith';
await user.save();
```

## Complete Example

```ts
import { Store } from '@warp-drive/core';

async function main() {
  const store = new Store({ adapter: 'json-api' });

  const user = await store.findRecord('user', '1');
  console.log(`Hello, ${user.name}!`);

  user.email = 'new@example.com';
  await user.save();
}

main();
```

## Next Steps

- [Working with Relationships](../concepts/relationships.md)
- [Caching Strategies](../concepts/caching.md)
