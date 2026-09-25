---
title: Pointer and Reference Fields
description: Proposes four PolarisMode relationship field kinds (pointer, pointer-array, reference, reference-array) for relationships whose related resources arrive via a separate request, where pointers assert the related resource is loaded and references tolerate its absence.
warp-drive-rfc: 4
emberjs-rfc:
emberjs-pr:
emberjs-branch:
sync-hash:
stage: proposed
start-date: 2026-09-25T00:00:00.000Z
release-date:
release-versions:
teams:
  - data
prs:
  accepted:
project-link:
suite:
---

# Pointer and Reference Fields

## Summary

PolarisMode gains four new relationship field kinds — `pointer`, `pointer-array`, `reference`,
and `reference-array` — for a category of relationship that LegacyMode apps use constantly but
that WarpDrive has never had a name for: a relationship whose related resource(s) are **not**
delivered alongside the parent resource and are **not** fetchable through the relationship, but
are instead expected to have been loaded by some other request. A **pointer** declares that the
related resource *must* already be in the cache when the field is read; WarpDrive asserts this
in development builds. A **reference** declares that the related resource *may* be missing; the
field exposes the related identity together with the record if (and only if) it is loaded. All
four kinds are synchronous, unidirectional (no inverse), never fetch, and never participate in
the relationship graph. This RFC is one of the pieces of
[#10408, "The Road to PolarisMode"](https://github.com/warp-drive-data/warp-drive/issues/10408);
it does not cover the `resource`/`collection` fields, paginated collections, or inverses.

## Motivation

### The strictness PolarisMode wants

PolarisMode's relationship story is intended to be strict about what a relationship's shape
promises. A synchronous relationship whose payload carries the related identity must carry the
related resource in the same document (sideloaded via `included`), and an asynchronous one must
carry a link that can fetch it. Today's `linksMode` validation in the JSON:API cache already
enforces the first half of this for the sync `belongsTo`/`hasMany` fields PolarisMode currently
supports: a relationship must either be "fully linked" or carry a `links.related`
(see [LinksMode](/guides/the-manual/misc/links-mode.md)). The planned `resource` and `collection`
fields keep that rule.

That rule has a gap. It has no way to express a relationship the developer *knows* will not be
satisfied by the document that delivers it, and that the developer does not want WarpDrive to
fetch either.

### The two relationships LegacyMode has been hiding

Auditing real apps (the discussion on
[#10408](https://github.com/warp-drive-data/warp-drive/issues/10408)) surfaced two families of
relationship that were only ever declared as `@belongsTo`/`@hasMany` with `async: false` because
nothing else existed. They show up for several recurring reasons:

- **Systemic knowledge.** The developer knows a prior or concurrent request delivers the related
  records — a route's parent model hook loaded every `user`, so `comment.author` "just works" as
  a sync relationship with no sideload.
- **The storefront pattern.** [ember-data-storefront](https://embermap.github.io/ember-data-storefront/)
  taught apps to mark relationships synchronous that were in fact asynchronous, and to load them
  up front.
- **The References API.** Apps used `belongsToReference()`/`hasManyReference()` to read *only the
  id* out of a relationship and avoid loading anything until explicitly desired.
- **APIs that cannot do better.** A second, non-integrated system — increasingly an AI
  recommendation or suggestion service — streams in something that *names* a resource (a type
  and an id) but cannot give its representation or even a link to it.

In LegacyMode these worked, badly. `async: true` would autofetch and eventually settle, with
tearing along the way. `async: false` would return `null` or a partial array with no signal that
anything was wrong. Neither behaviour is something PolarisMode can validate, because from the
schema alone it cannot tell "sideload expected but missing" (a bug) apart from "sideload never
expected" (by design).

The two families differ in exactly one way, and the difference is the whole point:

- A **pointer** presumes the related resource *must* have been loaded. Its absence is a
  programming error — the developer promised presence and the promise was broken.
- A **reference** allows the related resource to be *missing*. Its absence is a normal state the
  app renders around, and the identity is still valuable on its own (to key a placeholder, to
  issue a fetch, to compare against something else).

Any of LegacyMode's six sync/async × inverse/no-inverse `belongsTo`/`hasMany` permutations could
have been a pointer or a reference in disguise, which would be eighteen permutations to support.
This RFC deliberately does not do that. Pointers and references are **always synchronous** and
**always without an inverse**, which collapses them to four kinds: pointer and reference, each
to-one and to-many.

### Why distinct field kinds rather than an option

Making these distinct kinds rather than an `options` flag on `resource`/`collection` (or on the
existing `belongsTo`/`hasMany`) is a deliberate choice:

- **The contract is visible where the schema is read.** `kind: 'pointer'` tells a reader, a
  reviewer, and the schema DSL's type generation what the field promises without cross-referencing
  option semantics.
- **The validation can be precise.** Because the schema says "this must be loaded", WarpDrive can
  assert exactly that, with a message naming the field and the missing identity, instead of the
  generic "relationship data is undefined and no link is present" error that today's linksMode
  validator produces for a shape it cannot interpret.
- **The types can be precise.** A pointer's value is `T | null`; a reference's value carries the
  identity. Those are different TypeScript shapes, and separate kinds let the DSL and the schema
  types say so.
- **It keeps `resource` and `collection` strict.** Those fields get to keep the rule that sync
  means sideloaded and async means linked, with no escape hatch that silently weakens it.

### Expected outcome

- PolarisMode can express every sync relationship shape LegacyMode apps actually use, so
  migrating an app no longer requires first restructuring its API to sideload or link everything.
- WarpDrive can validate all of them: the strict `resource`/`collection` rule for the sideloaded
  and linked cases, a read-time presence assertion for pointers, and no assertion at all for
  references, which are correct by construction.
- Apps integrating a secondary system that can only name resources have a first-class field for
  it, with reactive resolution when the named resource later arrives.

## Detailed design

### Terminology

- **Pointer**: a relationship whose related resource(s) are promised to be present in the cache
  whenever the field is read. WarpDrive never fetches them.
- **Reference**: a relationship whose related resource(s) may or may not be present in the cache.
  WarpDrive never fetches them, and exposes the related identity regardless.
- **Related identity**: the `{ type, id }` (and stable `lid`) the API delivered for a
  relationship entry, represented at runtime as a `ResourceKey`.

Both terms are new to PolarisMode. "Reference" collides with LegacyMode's References API
(`belongsToReference()` / `hasManyReference()`); that API is one of the pieces of `Model` cruft
PolarisMode removes, so the term is free to be reclaimed there. See
[How we teach this](#how-we-teach-this) for how the overlap is addressed.

### The four field kinds

The four kinds follow the existing naming convention for a base kind and its array form
(`object`/`array`, `schema-object`/`schema-array`):

| Kind              | Cardinality | Value on read                          | When a related resource is not in the cache                     |
| ----------------- | ----------- | -------------------------------------- | --------------------------------------------------------------- |
| `pointer`         | to-one      | `T \| null`                            | Assertion in development builds; `null` in production           |
| `pointer-array`   | to-many     | `readonly T[]`                         | Assertion in development builds; the entry is omitted in production |
| `reference`       | to-one      | `ReactiveReference<T> \| null`         | `reference.data` is `null`; `reference.key` is still available  |
| `reference-array` | to-many     | `readonly ReactiveReference<T>[]`      | That entry's `data` is `null`; its `key` is still available     |

The schema for each:

```ts
interface PointerField {
  kind: 'pointer';
  name: string;
  sourceKey?: string;
  /**
   * The type of the related resource. When `polymorphic` is
   * true, the trait or abstract type the related resource must implement.
   */
  type: string;
  options?: {
    polymorphic?: boolean;
  };
}

interface PointerArrayField {
  kind: 'pointer-array';
  name: string;
  sourceKey?: string;
  type: string;
  options?: {
    polymorphic?: boolean;
  };
}

interface ReferenceField {
  kind: 'reference';
  name: string;
  sourceKey?: string;
  type: string;
  options?: {
    polymorphic?: boolean;
  };
}

interface ReferenceArrayField {
  kind: 'reference-array';
  name: string;
  sourceKey?: string;
  type: string;
  options?: {
    polymorphic?: boolean;
  };
}
```

Three things are deliberately absent from these options, because the field kind already fixes
them:

- **No `async`.** Pointers and references are synchronous by definition. They never fetch and
  never yield a promise or a document.
- **No `inverse`.** Pointers and references are unidirectional by definition. There is no
  `inverse: null` to write because there is no inverse to disclaim, and there is no `as` because
  nothing on the other side can point back through this field.
- **No `linksMode`.** These fields never use a link, so the flag has nothing to control.

A schema that supplies any of these keys on one of the four kinds is rejected by the schema
service's DEBUG-time schema validation, with a message pointing at the strict kind (`resource`,
`collection`) that supports the option. `polymorphic` is the one relationship option that
survives: a reference to "whatever the suggestion service returned" is exactly the polymorphic
case, and both a `type`'s trait/abstract-type semantics and the existing DEBUG check that a
delivered identity's `type` implements it carry over unchanged.

All four kinds are added to `PolarisModeFieldSchema` and to `CacheableFieldSchema`. They are also
added to `LegacyModeFieldSchema` (see [Availability in LegacyMode](#availability-in-legacymode)).
They are not valid in an `ObjectSchema`: like every relationship kind, they are fields of a
resource with its own identity.

### Example

A `post` resource whose author and tags are loaded by the route before any post is, whose
featured product comes from a commerce system, and whose "suggested reads" arrive from a
recommendation service that only knows ids:

```ts
store.schema.registerResource({
  type: 'post',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'title' },
    // the route loads every user and tag before it loads posts
    { kind: 'pointer', name: 'author', type: 'user' },
    { kind: 'pointer-array', name: 'tags', type: 'tag' },
    // a separate commerce API; the product may or may not be in the cache yet
    { kind: 'reference', name: 'featuredProduct', type: 'product' },
    // a recommendation service that returns ids of things implementing `readable`
    { kind: 'reference-array', name: 'suggestedReads', type: 'readable', options: { polymorphic: true } },
  ],
});
```

The JSON:API payload for a post looks exactly like the payload for any other relationship. The
schema, not the document, is what makes these pointers and references:

```json
{
  "data": {
    "type": "post",
    "id": "1",
    "attributes": { "title": "Hello" },
    "relationships": {
      "author": { "data": { "type": "user", "id": "7" } },
      "tags": { "data": [{ "type": "tag", "id": "a" }, { "type": "tag", "id": "b" }] },
      "featuredProduct": { "data": { "type": "product", "id": "sku-9" } },
      "suggestedReads": {
        "data": [
          { "type": "article", "id": "42" },
          { "type": "post", "id": "3" }
        ]
      }
    }
  }
}
```

Reading the fields:

```ts
const post = await store.request(findRecord('post', '1'));

post.data.author;          // User — asserts in DEBUG if user:7 is not in the cache
post.data.tags;            // readonly Tag[] — asserts in DEBUG if any tag is missing
post.data.featuredProduct; // ReactiveReference<Product> | null
post.data.featuredProduct?.key;  // ResourceKey { type: 'product', id: 'sku-9', lid }
post.data.featuredProduct?.data; // Product | null — null until the product is loaded
post.data.suggestedReads.map((ref) => ref.data ?? ref.key.id);
```

Loading a missing reference is an ordinary request, because a reference *is* an identity:

```ts
const ref = post.data.featuredProduct;
if (ref && !ref.data) {
  await store.request(findRecord(ref.key.type, ref.key.id));
  // ref.data is now the Product; anything rendering it updated reactively
}
```

### `ReactiveReference`

```ts
interface ReactiveReference<T> {
  /**
   * The identity the API delivered for this relationship entry.
   * Always present: a reference with no identity is represented as
   * `null` (to-one) or is simply absent from the array (to-many),
   * never as a ReactiveReference with a null key.
   */
  readonly key: ResourceKey;

  /**
   * The related record, if and only if the resource identified by
   * `key` is currently in the cache and not deleted. Reactive: it
   * becomes non-null when the resource is loaded and null again if
   * it is unloaded or its deletion is committed.
   */
  readonly data: T | null;
}
```

`data` is signal-backed. A `ReactiveReference` subscribes to the store's `NotificationManager`
for its `key` and re-resolves via the same "is this resource loaded" check `store.peekRecord`
uses (`cache.isEmpty` and `cache.isDeletionCommitted`), so it observes the resource arriving,
being unloaded, or being deleted without the reference having any relationship to the graph. A
`ReactiveReference` is created lazily on first read and cached per field on the owning record,
so repeated reads and renders share one instance.

This shape is intentionally the "not loaded" half of the shape the LinksMode guide already
describes for a future async `resource` field (`links`, `meta`, and `data` only-if-loaded), minus
the parts a reference cannot have. A reference is what an async relationship looks like when
there is nothing to fetch it with.

### Cache storage: alongside attributes, outside the graph

Pointers and references do not participate in the relationship graph. The graph exists to
maintain bidirectional consistency (inverses, including the implicit inverse it creates for
`inverse: null` relationships) and to reconcile remote and local membership under mutation.
Pointers and references have no inverse by definition, and their membership is exactly what the
API delivered: a unidirectional list of identities that no other resource's mutation should
rewrite. Routing them through the graph would give them behaviour they are defined not to have —
for instance, unloading a `tag` would silently remove it from every `post.tags`, converting a
broken promise into an invisible one.

Instead, a `Cache` implementation stores a pointer or reference field's `data` in its
per-resource storage alongside attributes, as stable `ResourceKey`s (so a locally-created related
record keeps its identity through save), and stores the relationship's `meta` next to it. For the
JSON:API cache this means `upsert` reads the field out of `relationships` — where the payload
carries it — and writes it into resource-local storage rather than calling into the graph.
`links`, if an API happens to send them, are preserved with `meta` but never used.

Local changes follow the attribute path. Setting a pointer or reference on an editable record
(a new record, or a copy obtained via `checkout()`) records a local value; `hasChangedAttrs`,
`changedAttrs`, `rollbackAttrs`, and the commit flow treat it like any other changed field, and
the JSON:API serialization utilities emit it under `relationships` with `data` holding the
identities. The exact `Cache` interface extension is called out in
[Unresolved questions](#unresolved-questions): either `getAttr`/`setAttr` widen to accept
identity-shaped values for these kinds, or the interface gains a dedicated pair of methods.

The values a mutation accepts follow the same contract as reads:

- A `pointer` accepts a record instance or `null`. A `pointer-array` on an editable record is a
  managed array of record instances (the same mechanics as `schema-array`'s managed array), and
  accepts a whole-array replacement of record instances. A pointer can only ever be set to
  something that is loaded, because a record instance is proof of loading.
- A `reference` accepts a record instance, a bare identity (`{ type, id }` or a `ResourceKey`),
  or `null`. A `reference-array` accepts the same per entry. Accepting bare identities is what
  lets an app record "the suggestion service said `product:sku-9`" without first loading it.

### Validation

Push-time validation for these kinds is minimal, and deliberately so. The JSON:API cache's
document validation (`validate-document-fields.ts`), which today enforces full linkage for
`linksMode` relationships, checks only one thing for a pointer or reference field: the
relationship object must carry a `data` key. `null` and `[]` are valid empty values; a missing
or `undefined` `data` is rejected with the same reasoning as for linksMode — WarpDrive cannot
distinguish "nothing was returned" from "the relationship is empty". Full linkage is *not*
checked, because not being linked is the definition of these fields.

Read-time validation is where pointers get their teeth. Reading a `pointer` whose identity is
not loaded, or a `pointer-array` any of whose identities is not loaded, fails a DEBUG assertion
naming the owning resource, the field, and each missing identity:

```
Assertion Failed: post:1 declares `author` as a pointer to user:7, but user:7 is not
loaded. A pointer promises its related resource was loaded by a separate request
before the field is read. Load user:7 first, or declare `author` as a `reference`
if it may legitimately be absent.
```

Assertions are stripped from production builds. There, a missing pointer target resolves to
`null` (to-one) or is omitted from the array (to-many) — the same degraded behaviour a sync
`linksMode` `belongsTo` exhibits today when its sideload is missing, and no worse. The assertion
is read-time rather than push-time on purpose: the separate request that satisfies a pointer may
land *after* the document that carries it, and only the read establishes that the promise has
come due.

References have no read-time assertion. An unloaded reference is a valid, expected state.

The polymorphic DEBUG check (a delivered identity's `type` must implement the field's `type`)
applies to all four kinds exactly as it does to the existing relationship kinds.

### Reactivity

- A `pointer` and a `pointer-array` are entangled with the owning record's field signal and
  re-resolve when the cache notifies the field, exactly as the current linksMode `belongsTo`
  and `hasMany` do. Because their targets are promised present, they do not additionally watch
  each target's lifecycle; if a target is unloaded, the next read asserts.
- A `ReactiveReference` watches its own `key` as described above. A `reference-array` is
  entangled with the field signal for membership changes, and each entry watches its own key
  for load state.
- On PolarisMode's immutable record instance, all four kinds render remote state and subscribe
  on the `'remote'` channel; on an editable copy they render reconciled local state and
  subscribe on `'local'`, mirroring the existing split for every other field.

### Availability in LegacyMode

The four kinds are added to `LegacyModeFieldSchema` as well as `PolarisModeFieldSchema`. They are
mode-independent in the same way `schema-array` is: nothing about them depends on `Model`
emulation, and the same reactive kind handlers serve both modes.

This is what turns the discovery in
[#10408](https://github.com/warp-drive-data/warp-drive/issues/10408) into a migration path. An
app can re-declare a `@hasMany('tag', { async: false, inverse: null })` that was always really a
pointer as `{ kind: 'pointer-array', name: 'tags', type: 'tag' }` while still in LegacyMode, get
the presence assertion immediately, discover which of its "sync" relationships were actually
references, and fix each one before flipping the resource to PolarisMode. Without LegacyMode
availability, every one of those relationships would have to be sorted out in the same change as
the mode switch.

`Model` itself (`@warp-drive/legacy/model`) gains no decorator for these kinds. They are
ReactiveResource fields; a `Model`-based app adopts them by moving the resource to a
`legacy: true` schema first.

### Schema DSL

`@warp-drive/schema-dsl` gains four decorators, one per kind, alongside the existing
`@belongsTo`/`@hasMany`:

```ts
import { Resource, field, pointer, pointerArray, reference, referenceArray } from '@warp-drive/schema-dsl';

@Resource
export class Post {
  @field declare title: string;

  @pointer({ type: 'user' })
  declare author: User | null;

  @pointerArray({ type: 'tag' })
  declare tags: readonly Tag[];

  @reference({ type: 'product' })
  declare featuredProduct: ReactiveReference<Product> | null;

  @referenceArray({ type: 'readable', polymorphic: true })
  declare suggestedReads: readonly ReactiveReference<Readable>[];
}
```

Each decorator accepts `type`, `polymorphic`, and `sourceKey`, and nothing else; the generated
TypeScript for the read, create, and edit views follows the value table above (the edit view of
a reference additionally accepts a bare identity on assignment).

### What this RFC does not cover

- The `resource` and `collection` fields, sync or async, with or without inverses — the "base
  six" of #10408. Pointers and references are independent of them and can land before, after, or
  alongside; nothing here changes their design.
- Paginated collections.
- Any fetching behaviour. A pointer or reference that needs loading is loaded with an ordinary
  request against the identity it exposes.
- Removing or deprecating the existing sync `linksMode` `belongsTo`/`hasMany` support in
  PolarisMode. That is the `resource`/`collection` RFC's concern.

## How we teach this

The vocabulary is the lesson. The manual's schema section gains a page on PolarisMode
relationships that presents them as a question about *where the related data comes from*, with
one answer per kind:

- **It comes with the parent, or through a link on the relationship** → `resource` /
  `collection` (strict: sideloaded when sync, linked when async).
- **It comes from some other request, and I promise that request has happened** → `pointer` /
  `pointer-array`.
- **It comes from some other request, or maybe never; here is who it would be** → `reference` /
  `reference-array`.

The one-line mnemonic: *a pointer is a promise, a reference is a hint.* The guide shows each
kind's failure mode on purpose — the pointer assertion's message, a reference rendering a
placeholder from `key` — because the failure modes are the reason the kinds exist.

The page also confronts the name collision directly. LegacyMode's References API
(`belongsToReference()`, `hasManyReference()`, `reference.load()`, `reference.reload()`) is a
way to *inspect and fetch* an existing `belongsTo`/`hasMany`; a PolarisMode `reference` field is
a *kind of relationship*. The [LegacyMode](/guides/the-manual/schemas/resources/legacy-mode.md)
and [PolarisMode](/guides/the-manual/schemas/resources/polaris-mode.md) pages each get a
cross-reference note, and the PolarisMode page's "very limited support for relationships"
preview limitation is updated as the kinds ship.

The [LinksMode](/guides/the-manual/misc/links-mode.md) guide's "What To Expect from PolarisMode
Relationships in the Future" section gains a paragraph placing pointers and references next to
the planned `resource`/`collection` shapes, so a reader who arrives via linksMode learns the
whole picture at once.

The consumer-facing agent skill for defining a resource schema
(`@warp-drive/memory-alpha`'s `schemas/define-a-resource-schema.md`) gains the four kinds in its
field-kind list, with the same one-line contract for each.

API docs for the four field interfaces and `ReactiveReference` ship with the implementation, per
the cross-documentation checklist. No lint rule changes are proposed; a future
`eslint-plugin-warp-drive` rule or codemod that flags `async: false, inverse: null` legacy
relationships as pointer/reference candidates would be useful for migration but is out of scope.

## Drawbacks

- **Four more field kinds.** The field-kind vocabulary grows from an already long list. The
  counter-argument is that the four map onto two concepts with an existing array-form convention,
  and each replaces a pattern apps were already using with no name at all.
- **Two value shapes.** A pointer yields the record; a reference yields a wrapper. A developer
  has to know which they declared to know what they get. This is the cost of exposing the
  identity for references, and the type system makes the difference visible at every use site.
- **"Reference" is overloaded** across the two modes for as long as LegacyMode's References API
  exists. The teaching section mitigates this; it cannot eliminate it.
- **Pointer failures surface at read time**, later than every other PolarisMode relationship
  validation, which happens at push time. A pointer that is never read never fails, and a pointer
  read on a code path a test does not exercise fails only in production, silently. This is
  inherent — the promise cannot be checked before it comes due — but it is weaker than the
  guarantee the strict kinds offer.
- **No automatic cleanup on unload.** Every other relationship kind is rewritten by the graph
  when a related resource is unloaded or deleted; these are not. This is the intended semantics
  (the field reports what the API said), but it is a behavioural difference a developer coming
  from `belongsTo`/`hasMany` will not expect until told.
- **A Cache interface change.** Storing identities alongside attributes needs either a widening
  of `getAttr`/`setAttr` or new methods, and third-party `Cache` implementations have to add
  support for four kinds before schemas using them work against that cache.

## Alternatives

- **An option on `resource`/`collection`** — e.g. `options: { loaded: 'required' | 'optional' }`
  or `options: { external: true }`. Rejected for the reasons in
  [Why distinct field kinds](#why-distinct-field-kinds-rather-than-an-option): it hides the
  contract in option semantics, makes the strict fields less strict, and forces the value type of
  one kind to depend on an option.
- **Reusing `belongsTo`/`hasMany` with `async: false, inverse: null` plus a `strict` flag.**
  Rejected: it perpetuates the fields PolarisMode is moving away from and leaves the pointer
  vs reference distinction, which is the important one, as a boolean.
- **References return `T | null` like pointers, with no wrapper.** Simpler, but it throws away
  the identity in exactly the case where the identity is the only thing the app has. Every
  motivating use case for references — placeholders, deferred fetching, cross-system ids — needs
  the identity when the record is absent. Listed as an unresolved question below, since the
  wrapper's shape is the largest design surface in this RFC.
- **Two kinds with a cardinality option** (`kind: 'pointer', options: { many: true }`). Rejected:
  every other WarpDrive field kind encodes cardinality in the kind (`object`/`array`,
  `schema-object`/`schema-array`, `resource`/`collection`, `belongsTo`/`hasMany`), and the value
  type would again depend on an option.
- **Plural kind names** (`pointers`, `references`) instead of `-array`. Purely a naming choice;
  the `-array` suffix follows `schema-array` and is harder to misread. Open for bikeshedding.
- **Routing pointers and references through the graph as implicit edges.** Rejected because the
  graph's job — inverse maintenance and mutation reconciliation — is what these fields are
  defined not to need, and its unload-time membership rewriting would mask exactly the broken
  promises pointers exist to expose.
- **Doing nothing**, and requiring apps to sideload or link every relationship before adopting
  PolarisMode. This is the status quo, and it is the reason relationships are the blocking item
  in #10408: a large class of real apps cannot get there from here without an API change.

Prior art: [MobX-State-Tree](https://mobx-state-tree.js.org/concepts/references) draws the
same line with `types.reference` (throws when the target is not in the tree) and
`types.safeReference` (resolves to `undefined`), and its users report the pair as one of the
library's more useful distinctions. Normalized GraphQL caches (Apollo, Relay) store every
relationship as a reference by identity and resolve at read time, which is the storage model
this RFC adopts, but do not distinguish promised from optional presence at the schema level.

## Unresolved questions

- **The `reference` value shape.** `ReactiveReference<T> | null` with `key` and `data` is the
  proposal. Alternatives are a plain `T | null` (see Alternatives), or a richer object that also
  exposes the relationship's `meta`. Whether `meta` (and unused `links`) should be exposed on
  `pointer-array`/`reference-array` at all, as `ManyArray` exposes them today, is part of the
  same question.
- **Kind names.** `pointer`/`pointer-array`/`reference`/`reference-array` versus plural forms,
  or a different base word for either concept.
- **The `Cache` interface extension.** Widen `getAttr`/`setAttr`/`changedAttrs` to carry
  identity-shaped values for these kinds, or add dedicated methods (e.g. `getPointer`/
  `setPointer`) so the attribute methods keep their `Value` typing.
- **Production behaviour for a missing pointer target in a `pointer-array`.** Omit the entry
  (proposed, matches today's linksMode behaviour) versus preserve a `null` hole so the array's
  length still reflects the relationship's membership.
- **Whether LegacyMode availability should be gated**, e.g. behind the same feature flag that
  gates other PolarisMode preview features, rather than unconditional, to avoid these kinds
  spreading in LegacyMode schemas before the PolarisMode relationship story is complete.
- **Sequencing relative to the `resource`/`collection` RFC.** #10408 proposes shipping the base
  six first and these four after. This RFC is written to be independent so that order can be
  decided on implementation readiness rather than on design coupling.
