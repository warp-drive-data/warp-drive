---
order: 8
---

# Transformations

Transformations define how data is converted between your API and your application.  
They act as translators, ensuring the data your app works with is always in the right shape and type regardless of how the backend sends it.

A Transformation handles two things:

- **Hydration**: converting the API value into something useful inside your app.  
- **Serialization**: converting that value back into the correct API format when saving.

Transformations are applied automatically when reading from or writing to the cache, keeping your data consistent everywhere.

## Why Transformations Matter

APIs often return data as plain strings or numbers, but your app might need more expressive or typed values like `Date` objects, numbers with precision, or even `Map`s.  
Transformations let you define exactly how those conversions happen, in a reusable and declarative way.

## Using a Built-in Transformation

WarpDrive ships with several built-in transformations.  
For example, the `date-time` transformation converts ISO date strings into JavaScript `Date` objects.

```ts [schemas/task.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const TaskSchema = withDefaults({
  type: 'task',
  fields: [
    { name: 'title', kind: 'field' },
    { name: 'dueAt', kind: 'field', type: 'date-time' }
  ]
});
```

When the API returns a record like this:

```json
{
  "title": "Deadline",
  "dueAt": "2025-10-03T18:00:00.000Z"
}
```

WarpDrive automatically hydrates `dueAt` into a `Date` object.  
When you save the record again, it serializes the `Date` back to an ISO string.

## Creating a Custom Transformation

You can define your own Transformation for any data type or format you need.

```ts [transforms/price.ts]
import { Type } from '@warp-drive/core/types/schema/symbols';

export const PriceTransform = {
  hydrate(apiValue: string) {
    return parseFloat(apiValue);
  },
  serialize(appValue: number) {
    return appValue.toFixed(2);
  },
  [Type]: 'price'
};
```

This example converts between a string (from the API) and a number (used in the app).

## Registering a Transformation

Before you can use a custom Transformation, it needs to be registered with the schema service:

```ts [store/index.ts]
import { store } from './store';
import { PriceTransform } from './transforms/price';

store.schema.registerTransformation(PriceTransform);
```

You can learn more about registration in the [`SchemaService.registerTransformation`](https://warp-drive.io/api/@warp-drive/core/types/schema/schema-service/interfaces/SchemaService#registertransformation) API reference.  
Registration should happen before any schemas that reference it are registered.

## Using a Transformation in a Schema

Once registered, reference your Transformation in a field definition by its `type`:

```ts [schemas/product.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const ProductSchema = withDefaults({
  type: 'product',
  fields: [
    { name: 'id', kind: '@id' },
    { name: 'price', kind: 'field', type: 'price' }
  ]
});
```

Now, every time you fetch a product, `price` will be a number.  
When you save, it will automatically serialize back to a string formatted with two decimal places.

## Example: Map Transformation

Here’s another example for when your API returns an object but you want to work with a `Map` in your app.

```ts [transforms/translation-map.ts]
import { Type } from '@warp-drive/core/types/schema/symbols';

export const TranslationMapTransform = {
  hydrate(value: Record<string, string>) {
    return new Map(Object.entries(value));
  },
  serialize(map: Map<string, string>) {
    return Object.fromEntries(map);
  },
  [Type]: 'translation-map'
};
```

Register it just like before, then use it in a schema:

```ts [schemas/article.ts]
export const ArticleSchema = withDefaults({
  type: 'article',
  fields: [
    { name: 'title', kind: 'field' },
    { name: 'translations', kind: 'field', type: 'translation-map' }
  ]
});
```

Now your app can do:

```ts
article.translations.get('en'); // "Hello"
article.translations.set('fr', 'Bonjour');
```

and everything remains reactive.

## Key Takeaways

- Transformations define how data moves between API and app.  
- They always run both directions: **hydrate** and **serialize**.  
- Built-ins like `date-time` handle common cases; you can register your own for custom needs.  
- Once registered, they can be referenced in any ResourceSchema field using `type`.  
- They keep your data layer predictable, typed, and consistent.

By using Transformations, you make your data flow explicit and your app resilient to API differences.  
They are the quiet workhorses that keep your data accurate and your UI reactive.
