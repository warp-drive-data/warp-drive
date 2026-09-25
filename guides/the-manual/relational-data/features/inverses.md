---
title: Inverses and Directionality
description: How the inverse option makes a relationship one-way or two-way, how WarpDrive keeps both sides of a two-way relationship in sync, and how direction affects which records see an edit and what gets loaded.
---

# Inverses and Directionality

Every relationship has a direction: it is declared on one resource type and points at another.
Whether the *other* side knows about it is decided by `options.inverse`. With `inverse: null` the
relationship is one-way; with the name of a field on the related type it is two-way, and that
field is its **inverse**.

## One-Way Relationships

```ts
{
  name: 'author',
  kind: 'resource',
  type: 'user',
  options: {
    inverse: null, // [!code highlight]
    async: false,
  },
}
```

::: tip `inverse: null` is the declaration
`inverse: null` is what makes a relationship one-way. For `resource` and `collection` fields it is
also the default when `inverse` is omitted, but declare it explicitly anyway: it tells readers of
the schema that the missing reverse field is intentional, and it matches the legacy `belongsTo`
and `hasMany` kinds, which infer an inverse when the option is omitted and only stay one-way when
it is `null`.
:::

With `inverse: null` WarpDrive treats the relationship as one-way. Setting `post.author.data`
changes only `post`; the `user` has no field that reflects it. Internally the graph still tracks an
implicit reverse edge so it can clean up when a `user` is unloaded, but nothing is exposed.

Use one-way relationships when the reverse list would be large or meaningless (a comment's author
should not imply a user's list of every comment ever written) — see
[Large Collections](../advanced/large-collections.md).

## Two-Way Relationships

```ts
// on post
{ name: 'comments', kind: 'collection', type: 'comment', options: { inverse: 'post', async: false } }
// on comment
{ name: 'post', kind: 'resource', type: 'post', options: { inverse: 'comments', async: false } }
```

With inverses declared on both sides, a change to either side updates the other. Pushing a
`comment` whose `post` is `1` adds it to `post:1.comments`; removing it from `post.comments.data`
clears `comment.post.data`. The [configuration guides](../index.md#configuration) walk through
each cardinality.

Inverses may pair any relationship kinds: `collection` ↔ `resource`, `collection` ↔ `collection`,
`resource` ↔ `resource`, and each of these with the legacy `hasMany`/`belongsTo` kinds.

## Which Records See An Edit

Direction also decides what an edit is visible from. In PolarisMode, a change made through a
checked-out `post` shows up on:

- the checked-out `post` (local state),
- a checked-out copy of the affected `comment` (local state of the inverse),

and does **not** show on the immutable `post` or `comment` until saved or committed. In LegacyMode
records read local state, so both sides reflect the edit immediately.

## Which Side To Load

The direction a relationship is loaded from matters for large lists. Loading the "one" side (a
`comment` with its `post`) is cheap; loading the "many" side (a `post` with all of its
`comments`) costs as much as the list is long. Prefer declaring the relationship's `data` on the
one side and expose the many side as a link or a top-level request — see
[Links vs Identifiers](./links-vs-identifiers.md).
