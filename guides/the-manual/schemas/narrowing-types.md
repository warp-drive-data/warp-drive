---
description: Write one source type per resource, then derive the narrower types each context needs, such as query previews, create and patch bodies, and editable copies, with native and WarpDrive type utilities so they can never drift from the source, and why WarpDrive brands types with `[Type]` to make that work.
---

# Narrowing Types From One Source

Write each resource's type once, then derive every narrower type from it. A list that shows
three fields, a form that creates a record, a request that patches one, and an editable copy
of a record are all views of the same resource. Each should be written as a view of the
source type, never as a second interface that happens to look similar.

Hand-written parallel interfaces compile whether or not they still match the resource. Rename
`name` to `fullName` on `User` and a hand-written `UserPreview` keeps saying `name`, so the
list renders `undefined`, the type checker is happy, and nothing tells you. A derived
`UserPreview` stops compiling the moment the field it picks no longer exists.

This page explains the `[Type]` brand that makes the pattern work, then works through it for query
projections, mutations and editable copies, and shows how it fits into
[builders](../requests/builders.md). If your resources are still `Model` classes, see
[Typing Models](./narrowing-types-legacy.md).

## The Source Type

Describe each resource once, with every field and relationship it has, in the shape of a record
you read from the store. The `[Type]` brand names the resource type, and the fields are
`readonly` because records are read-only until you [check one out for editing](#editable-copies).

```ts [data/types.ts]
import type { Type } from '@warp-drive/core/types/symbols';

export interface Address {
  readonly [Type]: 'address';
  readonly id: string;
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
}

export interface User {
  readonly [Type]: 'user';
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly title: string;
  readonly bio: string | null;
  /** Set by the server. */
  readonly createdAt: Date;
  readonly address: Address;
}
```

This is the only place the shape of a `User` is written down. Everything else on this page is
derived from it.

## Why Types Are Branded

`[Type]` is not a field on the data. It is a *brand*: a symbol-keyed property that exists only in the
type system, which WarpDrive reads to learn which resource type a TypeScript type describes. That is
how `store.findRecord<User>('user', '1')` can check that `'user'` is the right string and return a
`User`, with nothing registered anywhere.

Brands are used instead of registries or classes because of this page's pattern. A registry maps a
resource type string such as `'user'` to exactly one type, but a resource has many valid shapes:
the full record, a preview, a create body, a patch, an editable copy. A brand travels with each
type instead, so `User`, `UserPreview` and `EditableUser` all say `'user'` while differing in
everything else.

Registries also top out at a few hundred entries before TypeScript gives up and resolves them to
`any`, break when types come from more than one library, can't describe more than one store or
source of schema, and hide where a type is used from bundlers. Using a class as the token, as in
`store.findRecord(User, '1')`, would force every resource to be a class, but schemas are JSON, so
there is no class to import. The brand needs none of this.

In practice, keep the brand when you derive a type that should still be recognized as a record, as
the next sections do with `typeof Type` in each `Pick`.

## The Toolbox

Most narrowing needs only TypeScript's built-in utility types. WarpDrive adds a few for the
cases they don't cover.

| Utility | From | Use it to |
| --- | --- | --- |
| `Pick<T, K>` | TypeScript | keep only the named fields |
| `Omit<T, K>` | TypeScript | drop the named fields |
| `Partial<T>` | TypeScript | make every field optional, as in a patch |
| `Required<T>` | TypeScript | make every field required again |
| `Readonly<T>` | TypeScript | make every field read-only |
| [`Mask<K, T>`](/api/@warp-drive/core/types/record/types/Mask) | WarpDrive | swap a relationship's full type for a narrower preview of it |
| [`Validate<K, T>`](/api/@warp-drive/core/types/record/types/Validate) | WarpDrive | check that a hand-written type is still a subset of the source |
| [`WithPartial<T, K>`](/api/@warp-drive/core/types/utils/types/WithPartial) | WarpDrive | make only the named fields optional |
| [`Mutable<T>`](/api/@warp-drive/core/types/utils/types/Mutable) | WarpDrive | remove `readonly` from every field |

Two habits keep the results correct:

- **Keep the brand when you want a record.** `Pick<User, 'name'>` has no `[Type]`, so it is a
  plain object. Include `typeof Type` in the pick, as in `Pick<User, typeof Type | 'name'>`, when
  the narrower type describes a record that WarpDrive should recognize.
- **Don't write the field list twice.** If two derived types need the same fields, derive one
  from the other instead of repeating the list.

## Projections for Queries

A query that asks the server for a few fields returns less than a `User`. Describe what it
returns as a subset of `User`, so that when the source changes, every projection that depends on
the change fails to compile.

Start with `Pick` for the fields you want. A relationship field is still typed as the full
related resource, though, so use [`Mask`](/api/@warp-drive/core/types/record/types/Mask) to narrow
it too:

```ts [data/types.ts]
import type { Mask } from '@warp-drive/core/types/record';

export type AddressPreview = Pick<Address, typeof Type | 'city'>;

export type UserPreview = Mask<
  { address: AddressPreview },
  Pick<User, typeof Type | 'name' | 'address'>
>;
// { [Type]: 'user'; name: string; address: { [Type]: 'address'; city: string } }
```

`Mask` only accepts a replacement that is assignable from the source field, so
`{ address: { city: number } }` fails to compile instead of lying about the data.

A `User` is assignable to a `UserPreview`, so a function that needs only a preview accepts a full
record too. The reverse is a compile error, which is the point: code that asks for a preview can't
read a field the request didn't load.

### Validating Hand-Written Previews

`Pick` and `Mask` are the most precise tools, but on very large resource types they can slow the
type checker. In that case you can write the preview by hand and let
[`Validate`](/api/@warp-drive/core/types/record/types/Validate) prove it is still a subset of the
source:

```ts
import type { Validate } from '@warp-drive/core/types/record';

interface UserPreview {
  readonly [Type]: 'user';
  readonly name: string;
  readonly address: { readonly [Type]: 'address'; readonly city: string };
}

// fails to compile if UserPreview is no longer a subset of User
export type ValidUserPreview = Validate<UserPreview, User>;
```

### A Request That Returns the Projection

The builder pairs the projection with the request that loads only those fields.
[Builders](../requests/builders.md#get-a-list-of-partial-data) walks through a full example.

```ts [builders/get-user-previews.ts]
import { withReactiveResponse } from '@warp-drive/core/request';
import type { UserPreview } from '#/data/types';

/**
 * Gets every user as a {@link UserPreview}.
 *
 * - Endpoint: `GET /api/users?fields[user]=name,address&include=address&fields[address]=city`
 */
export function getUserPreviews() {
  return withReactiveResponse<UserPreview[]>({
    url: '/api/users?fields[user]=name,address&include=address&fields[address]=city',
  });
}
```

The `fields` in the URL and the fields in `UserPreview` still need to agree, and no utility can
check that for you. Write them next to each other, in the builder, and the pair is easy to review.

## Mutations

A mutation sends a narrower shape than the record: a new user has no `id` and no `createdAt`, and
a patch carries only what changed. Derive both from the fields a client is allowed to write.

First name the writable fields once. Use `Pick` to choose them, which leaves out `id`, `[Type]`,
server-managed fields like `createdAt`, and relationships you save another way, then
[`Mutable`](/api/@warp-drive/core/types/utils/types/Mutable) to drop the `readonly` modifier:

```ts [data/types.ts]
import type { Mutable, WithPartial } from '@warp-drive/core/types/utils';

/** The fields a client may write. */
export type UserFields = Mutable<Pick<User, 'name' | 'email' | 'title' | 'bio'>>;
```

Then derive each mutation's shape from `UserFields`:

```ts [data/types.ts]
/** A new user: `bio` and `title` are optional, everything else is required. */
export type CreateUser = WithPartial<UserFields, 'bio' | 'title'>;

/** A patch: any subset of the writable fields. */
export type PatchUser = Partial<UserFields>;
```

[`WithPartial`](/api/@warp-drive/core/types/utils/types/WithPartial) makes only the named fields
optional. Use it when a create body has a mix of required and optional fields, where `Partial`
would make all of them optional.

Each of these fails to compile when it should:

```ts
const user: CreateUser = { name: 'Ada', email: 'ada@example.com' }; // ok

// @ts-expect-error `email` is required to create a user
const incomplete: CreateUser = { name: 'Ada' };

// @ts-expect-error `createdAt` is set by the server, not the client
const patch: PatchUser = { createdAt: new Date() };
```

If `User` gains a required field you do want clients to write, add it to `UserFields` and every
create body that omits it stops compiling. If a field is renamed, `Pick` stops compiling.

### Builders for Mutations

Use the derived types for each mutation builder's arguments. The builder takes the narrow shape
and the record it changes, and returns the full resource the server responds with:

```ts [builders/create-user.ts]
import { withReactiveResponse } from '@warp-drive/core/request';
import type { CreateUser, User } from '#/data/types';

/**
 * Creates a user.
 *
 * - Endpoint: `POST /api/users`
 * - Invalidates every cached `user` query, so lists refetch with the new user.
 *
 * @param attributes the fields of the new user
 */
export function createUser(attributes: CreateUser) {
  return withReactiveResponse<User>({
    method: 'POST',
    url: '/api/users',
    body: JSON.stringify({ data: { type: 'user', attributes } }),
    op: 'createRecord',
    cacheOptions: { types: ['user'] },
  });
}
```

```ts [builders/patch-user.ts]
import { withReactiveResponse } from '@warp-drive/core/request';
import type { PatchUser, User } from '#/data/types';

/**
 * Updates a user.
 *
 * - Endpoint: `PATCH /api/users/:id`
 * - Sends only the fields in `changes`.
 *
 * @param user the user to update
 * @param changes the fields to change
 */
export function patchUser(user: User, changes: PatchUser) {
  return withReactiveResponse<User>({
    method: 'PATCH',
    url: `/api/users/${user.id}`,
    body: JSON.stringify({ data: { type: 'user', id: user.id, attributes: changes } }),
    op: 'updateRecord',
  });
}
```

Notice that `User` is both what these builders return and what `patchUser` accepts as the record to
change. Only the arguments the caller supplies are narrowed.

### Editable Copies

[`checkout`](/api/@warp-drive/core/reactive/functions/checkout) returns an editable copy of a
record, typed by the generic you pass it. Derive that type from the source too:

```ts [data/types.ts]
/** A copy of a User returned by `checkout`, whose fields can be assigned. */
export type EditableUser = Mutable<User>;
```

```ts
import { checkout } from '@warp-drive/core/reactive';
import type { EditableUser, User } from '#/data/types';

async function rename(user: User, name: string) {
  const editable = await checkout<EditableUser>(user);
  editable.name = name; // ok
}
```

`user.name = name` on the original, read-only `User` is a compile error, while the same assignment
on the editable copy compiles. If you want the form to be able to edit only some fields, narrow
further with `Pick` first, as in `Mutable<Pick<User, typeof Type | 'name'>>`.

## Putting It Together

Every type below comes from the one `User`:

| Context | Type | Derived with |
| --- | --- | --- |
| Reading a record | `User` | the source |
| A list item | `UserPreview` | `Pick` and `Mask` |
| The writable fields | `UserFields` | `Pick` and `Mutable` |
| Creating a record | `CreateUser` | `WithPartial` on `UserFields` |
| Patching a record | `PatchUser` | `Partial` on `UserFields` |
| Editing a record | `EditableUser` | `Mutable` |

Change `User` and the compiler points at each derived type, and so each builder, that the change
affects.

## What's Next

- [Builders](../requests/builders.md) covers writing, documenting, and caching the requests these
  types are for.
- [Typing Requests](../requests/typing-requests.md) covers the response types a builder declares.
