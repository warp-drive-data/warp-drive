---
order: 8
---

# Transformations

Transformations define how a `field` value is converted between raw cache data and the value your app reads or writes.

Use them when the shape in your API/cache should differ from the shape your UI code works with.

## What a Transformation Does

A transformation has three parts:

- `hydrate`: raw cache value -> app value (runs when reading from the record)
- `serialize`: app value -> raw cache value (runs when writing to the record)
- `defaultValue` (optional): raw default when a value is missing

In current WarpDrive packages, this contract is:

```ts
export type Transformation<T = Value, PT = unknown> = {
  serialize(value: PT, options: ObjectValue | null, record: OpaqueRecordInstance): T;
  hydrate(value: T | undefined, options: ObjectValue | null, record: OpaqueRecordInstance): PT;
  defaultValue?(options: ObjectValue | null, identifier: ResourceKey): T;
  [Type]: string;
};
```

## Defining and Registering a Transformation

```ts [store/transformations/float.ts]
import type { ReactiveResource, Transformation } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import { Type } from '@warp-drive/core/types/symbols';

export const FloatTransform: Transformation<string | number, number> = {
  serialize(value: string | number, options: { precision?: number } | null, _record: ReactiveResource): string {
    return typeof value === 'number'
      ? value.toFixed(options?.precision ?? 3)
      : Number(value).toFixed(options?.precision ?? 3);
  },

  hydrate(value: string | undefined, _options: { precision?: number } | null, _record: ReactiveResource): number {
    if (value === undefined || value === null) {
      return 0;
    }

    return Number(value);
  },

  defaultValue(options: { precision?: number } | null, _identifier: ResourceKey): string {
    return (0).toFixed(options?.precision ?? 3);
  },

  [Type]: 'float',
};
```

```ts [store/index.ts]
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';
import { FloatTransform } from './transformations/float';

const Store = useRecommendedStore({ cache: JSONAPICache });

const store = new Store();
store.schema.registerTransformation(FloatTransform);
```

## Using It in a Schema

Transformations apply to `kind: 'field'` (and other transform-aware field kinds) via `type`.

```ts [schemas/user.ts]
import { withDefaults } from '@warp-drive/core/reactive';

export const UserSchema = withDefaults({
  type: 'user',
  fields: [
    { name: 'name', kind: 'field' },
    { name: 'rank', kind: 'field', type: 'float', options: { precision: 0 } },
    { name: 'netWorth', kind: 'field', type: 'float', options: { precision: 2 } },
  ],
});
```

With this schema:

- `record.netWorth` is a `number` in app code
- cache/raw value remains a serialized string (for this transform)

## Behavior Notes

- Transformations are guaranteed to run when reading and writing transformed fields.
- If a field references an unregistered transform, reading that field throws.
- Keep transformations pure and synchronous.
- Avoid cross-field logic in transformations. If you need to compute from other fields, use a derivation instead.

## Transformation vs Derivation

- Use a transformation when one field needs type/shape conversion.
- Use a derivation when a value is computed from one or more fields and is read-only.

See [Derivations](./derivations.md) for computed field behavior.
