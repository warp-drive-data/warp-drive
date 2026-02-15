# VitePress Markdown Features Example

This file showcases the markdown features available in the WarpDrive documentation site.

## Containers

::: info
This is an informational callout.
:::

::: tip Pro Tip
Always use TypeScript for better type safety.
:::

::: warning Breaking Change
This API changed in version 2.0.
:::

::: danger Security Warning
Never expose API keys in client-side code.
:::

::: details Click to see implementation
```ts
function implementation() {
  // Implementation details here
  return 'hidden by default';
}
```
:::

## Code Features

### Basic Code Block

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  // Fetch user logic
  return { id, name: 'John', email: 'john@example.com' };
}
```

### Line Highlighting

```typescript{2,4-6}
interface Config {
  apiUrl: string;  // highlighted
  timeout: number;
  retries: number;  // highlighted
  caching: boolean;  // highlighted
  logging: boolean;  // highlighted
}
```

### Line Numbers

```typescript:line-numbers
const store = new Store({
  adapter: new JSONAPIAdapter(),
  serializer: new JSONAPISerializer()
});

await store.request({ type: 'user', id: '1' });
```

### Focus Highlighting

```typescript
function authenticate(credentials: Credentials) {
  const token = generateToken(credentials); // [!code focus]
  return { token, expiresIn: 3600 };
}
```

### Diff Highlighting

```typescript
function calculate(a: number, b: number): number {
  return a + b; // [!code --]
  return a * b; // [!code ++]
}
```

### Error and Warning Highlighting

```typescript
function dangerousOperation() {
  delete window.localStorage; // [!code error]
  console.log('Debug info'); // [!code warning]
  return processData();
}
```

## Code Groups

::: code-group

```ts [TypeScript]
import { Store } from '@warp-drive/store';

const store = new Store({
  adapter: new JSONAPIAdapter(),
});

const user = await store.request<User>({
  type: 'user',
  id: '1',
});
```

```js [JavaScript]
import { Store } from '@warp-drive/store';

const store = new Store({
  adapter: new JSONAPIAdapter(),
});

const user = await store.request({
  type: 'user',
  id: '1',
});
```

:::

## Tabs Plugin

:::tabs

== Option 1: Simple Setup
For basic use cases, use the default configuration:

```ts
const store = new Store();
```

== Option 2: Custom Configuration
For advanced use cases, customize the configuration:

```ts
const store = new Store({
  adapter: new CustomAdapter(),
  serializer: new CustomSerializer(),
  cache: new CustomCache(),
});
```

== Option 3: Framework Integration
When integrating with a framework:

```ts
import { setupStore } from './store-setup';

const store = setupStore({
  framework: 'react',
  plugins: [reactivePlugin()],
});
```

:::

## Group Icons

::: group-icons

- [[typescript]] Full TypeScript support with strict types
- [[vue]] Vue 3 reactivity integration
- [[vite]] Lightning-fast build times
- [[javascript]] Works with plain JavaScript too

:::

## Links and Navigation

### Internal Links

- [Getting Started Guide](../getting-started)
- [API Documentation](/api)

### External Links

- [GitHub Repository](https://github.com/warp-drive-data/warp-drive)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Custom Anchors

### Main Topic {#main}

This section can be linked with `#main`.

### Subtopic {#sub}

This section can be linked with `#sub`.

[Jump back to Main Topic](#main)

## Images

![WarpDrive Logo](/logos/warp-drive/warp-drive-logo-dark.svg)

## Tables

| Feature | Support | Since |
|---------|---------|-------|
| TypeScript | ✅ | 1.0 |
| JSDoc | ✅ | 1.0 |
| Framework Agnostic | ✅ | 2.0 |
| GraphQL | ⚠️ | 3.0 |
| REST | ✅ | 1.0 |

## Task Lists

- [x] Core implementation
- [x] TypeScript types
- [ ] GraphQL support
- [ ] Performance optimizations

## Footnotes

Here's a statement with a reference.[^1]

Another statement with an inline footnote.^[This is the inline footnote.]

[^1]: This is the footnote that explains the reference in detail.

## Nested Lists

1. First level
   - Second level
     - Third level
       - Fourth level
   - Back to second
2. Another first level
   1. Nested numbered
   2. Another nested
      - Mixed with bullets

## Blockquotes

> "The best way to predict the future is to invent it."
>
> — Alan Kay

Nested quotes:

> This is the outer quote.
>
> > This is nested inside.
> >
> > > And this is nested even deeper.

## Horizontal Rules

Section above

---

Section below

***

Another section

## Vue Components in Markdown

<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>

Current count: {{ count }}

Doubled: {{ doubled }}

<button @click="count++">Increment</button>
<button @click="count = 0">Reset</button>

## Custom Styling

<div class="custom-block">
  <strong>Custom Block:</strong> This is a custom styled block with raw HTML.
</div>

<style scoped>
.custom-block {
  padding: 1rem;
  border-left: 4px solid #42b883;
  background-color: rgba(66, 184, 131, 0.1);
  margin: 1rem 0;
}

button {
  margin: 0.5rem 0.25rem;
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #33a372;
}
</style>

## Best Practices

::: tip Use Semantic Containers
Choose the right container type for your content:
- **info**: Additional context
- **tip**: Best practices and recommendations
- **warning**: Important caveats
- **danger**: Critical issues and breaking changes
- **details**: Optional deep dives
:::

::: warning Avoid Over-Highlighting
Too much highlighting makes nothing stand out. Use focus, diff, error, and warning highlights sparingly.
:::

::: details Advanced Example
Here's a comprehensive example combining multiple features:

```typescript{3,8-10}:line-numbers
import { Store } from '@warp-drive/store';

const store = new Store(); // [!code focus]

async function loadUser(id: string) {
  try {
    const user = await store.request({ // [!code --]
    const user = await store.findRecord('user', id); // [!code ++]
    console.log('Debug mode'); // [!code warning]
    throwError(); // [!code error]
    return user;
  } catch (error) {
    handleError(error);
  }
}
```
:::
