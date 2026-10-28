---
legacy: true
legacyAdvice: "New code should define its data with [ResourceSchemas](/guides/the-manual/schemas/resources/index.md) instead of Models."
description: Type resources defined as Model classes, branding them and their Transforms with the `Type` symbol, typing relationships, and deriving narrower types from a Model with Pick, as in the schema-based guide.
---

# Typing Models & Transforms

This is the `Model` class version of [Narrowing Types From One Source](./narrowing-types.md), which
explains the pattern and the `[Type]` brand. Read it first: everything there about deriving narrower
types applies to a Model's instance type too. This page covers what is specific to Models, the brand
and the relationship field types, then shows the derived types.

## Type

Example: add the `Type` brand to the `user` model.

```ts
import Model, { attr } from '@warp-drive/legacy/model';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @attr declare name: string;

  [Type] = 'user' as const;
}
```

The benefit of the above is that the value of Type is readable at runtime and thus easy to debug.
However, you can also choose to do this via types only:

```ts
import Model, { attr } from '@warp-drive/legacy/model';
import type { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @attr declare name: string;

  declare [Type]: 'user';
}
```

WarpDrive will never access Type as an actual value, these brands are *purely* for type inference.

## Transforms

Transforms with a `Type` brand will have their type and options validated. Once we move to stage-3 decorators, the signature of the field would also be validated against the transform.

Example: Typing a Transform

```ts
import type { Type } from '@warp-drive/core/types/symbols';

export default class BigIntTransform {
  deserialize(serialized: string): BigInt | null {
    return !serialized || serialized === '' ? null : BigInt(serialized + 'n');
  }
  serialize(deserialized: BigInt | null): string | null {
    return !deserialized ? null : String(deserialized);
  }

  declare [Type]: 'big-int';

  static create() {
    return new this();
  }
}
```

Example: Using Transforms

```ts
import Model, { attr } from '@warp-drive/legacy/model';
import type { StringTransform } from '@warp-drive/legacy/serializer/transform';
import type { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @attr<StringTransform>('string') declare name: string;

  declare [Type]: 'user';
}
```

## Sync BelongsTo

`belongsTo` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { belongsTo } from '@warp-drive/legacy/model';
import type Address from './address';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @belongsTo<Address>('address', { async: false, inverse: null })
  declare address: Address;

  [Type] = 'user' as const;
}
```

## Async BelongsTo

`belongsTo` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { belongsTo, AsyncBelongsTo } from '@warp-drive/legacy/model';
import type Address from './address';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @belongsTo<Address>('address', { async: true, inverse: null })
  declare address: AsyncBelongsTo<Address>;

  [Type] = 'user' as const;
}
```

## Sync HasMany (data only)

If you don't need access to meta or links on relationships, you can type the relationship as just an array.

`hasMany` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { hasMany } from '@warp-drive/legacy/model';
import type Post from './post';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @hasMany<Post>('post', { async: false, inverse: 'author' })
  declare posts: Post[];

  [Type] = 'user' as const;
}
```

## Sync HasMany (with meta, links, etc)

`hasMany` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { hasMany, HasMany } from '@warp-drive/legacy/model';
import type Post from './post';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @hasMany<Post>('post', { async: false, inverse: 'author' })
  declare posts: HasMany<Post>;

  [Type] = 'user' as const;
}
```

## Async HasMany (restricted)

If you don't need access to meta, links or template iterations on relationships, you can type the relationship as just a promise resolving to an array. Only use this if the value
will always be awaited before iteration.

`hasMany` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { hasMany, AsyncHasMany } from '@warp-drive/legacy/model';
import type Post from './post';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @hasMany<Post>('post', { async: true, inverse: 'author' })
  declare posts: Promise<Post[]>;

  [Type] = 'user' as const;
}
```

`Promise<HasMany<Post>>` also works.

## Async HasMany (with links, meta, etc.)

`hasMany` relationships will have their resource type and options config validated against the passed in type.

Once we move to stage-3 decorators, explicitly setting the generic would not be required as it could be inferred from the field's type.

```ts
import Model, { hasMany, AsyncHasMany } from '@warp-drive/legacy/model';
import type Post from './post';
import { Type } from '@warp-drive/core/types/symbols';

export default class User extends Model {
  @hasMany<Post>('post', { async: true, inverse: 'author' })
  declare posts: AsyncHasMany<Post>;

  [Type] = 'user' as const;
}
```

## Deriving Narrower Types From a Model

Treat the `Model` as the same read-only source type that
[Narrowing Types From One Source](./narrowing-types.md) describes, even though its instances are
mutable. Derive every preview, create, patch and editable type from it with `Pick` instead of using
the Model class in those places directly. Then when the resource moves to a
[ResourceSchema](./resources/index.md) and a plain source interface, only the source type changes:
every derived type, and every builder that uses one, keeps compiling as written. A builder that took
a `User` Model class as its argument has to be rewritten at migration time.

A `Model` instance type carries every field you declared, plus the base class's own properties, so
derive narrower types from it with `Pick` of the fields you want, never `Omit` of the ones you don't.
`Omit` would keep all of the base class's properties in the result.

```ts
import type { Type } from '@warp-drive/core/types/symbols';
import type User from '#/models/user';

/** The fields a list of users renders. */
export type UserPreview = Pick<User, typeof Type | 'name'>;

/** The fields a client may write when creating a user. */
export type CreateUser = Pick<User, 'name'>;

/** The fields a client may change on an existing user. */
export type PatchUser = Partial<CreateUser>;
```

Keep `typeof Type` in a `Pick` that should still be recognized as a record, as in `UserPreview`. Use
the same `Mask`, `Validate`, `WithPartial` and `Mutable` utilities described in
[Narrowing Types From One Source](./narrowing-types.md#the-toolbox) for relationships and optional
fields. Derive an editable type for the form code that changes a record too, as in
`Mutable<Pick<User, typeof Type | 'name'>>`, even though assigning to a Model directly would compile.
Code written against the derived type is already shaped for a schema-based record, where the source
is read-only and changes go through an editable copy.
