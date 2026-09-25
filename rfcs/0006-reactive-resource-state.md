---
title: A $state Field for PolarisMode ReactiveResources
description: Proposes adding a reactive, read-only $state field to the PolarisMode defaults that reports a resource's lifecycle state (new, deleted, dirty, saving, invalid, errored), replacing the LegacyMode state flags that still apply and dropping the ones that don't.
warp-drive-rfc: 6
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
  - learning
  - typescript
prs:
  accepted:
project-link:
suite:
---

# A `$state` Field for PolarisMode ReactiveResources

## Summary

`withDefaults` from `@warp-drive/core/reactive` adds a new derived field, `$state`, to every
PolarisMode resource schema it builds, and `registerDerivations` registers the `@state`
derivation that backs it. `$state` is a stable, read-only, deeply reactive object describing the
resource's lifecycle:

```ts
interface ReactiveResourceState {
  readonly isNew: boolean;
  readonly isDeleted: boolean;
  readonly isDeletionCommitted: boolean;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly isValid: boolean;
  readonly errors: ApiError[];
  readonly isError: boolean;
  readonly error: unknown;
}
```

It is the PolarisMode counterpart to the state flags LegacyMode puts directly on a record
(`isNew`, `isDeleted`, `hasDirtyAttributes`, `isSaving`, `isValid`, `errors`, `isError`,
`adapterError`, ...), keeping the ones that still mean something for a PolarisMode resource,
cleaning up their names and return types, and dropping the ones that don't.

## Motivation

A PolarisMode resource built with `withDefaults` today exposes its identity (`id`, `$key`,
`$type`) and its data, but nothing about its lifecycle. To answer "is this record new?", "does it
have unsaved changes?", "is it saving?" or "did the save fail validation?" an app has to reach
past the resource into the cache and the request state service:

```ts
const key = recordIdentifierFor(user);
const isNew = store.cache.isNew(key);
const isDirty = store.cache.hasChangedAttrs(key) || store.cache.hasChangedRelationships(key);
const errors = store.cache.getErrors(key);
const isSaving = store
  .getRequestStateService()
  .getPendingRequestsForRecord(key)
  .some((req) => req.type === 'mutation');
```

None of those reads are reactive: the cache is not a signal-backed structure, so a template or
component that reads them will not update when the value changes. Getting reactivity means
subscribing to the `NotificationManager` and the `RequestStateService` by hand and managing that
subscription's lifetime, which is exactly the machinery `RecordState` already implements for
LegacyMode.

This gap shows up as soon as an app migrates from `Model` (or LegacyMode schemas) to PolarisMode.
Every edit form needs "has unsaved changes", "saving..." and field-level validation
errors, and every one of them is currently re-implementing it, usually without reactivity or
without cleaning up its subscriptions.

The goal is for the canonical PolarisMode resource to answer those questions itself, reactively,
without adding a second, parallel copy of LegacyMode's flag soup to it.

## Detailed design

### The field

`withDefaults` appends one field to the schema:

```ts
{ kind: 'derived', name: '$state', type: '@state' }
```

`registerDerivations` registers the `@state` derivation alongside the existing `@identity` and
`@constructor` derivations. `useRecommendedStore` already calls `registerDerivations`, so apps
using it get `$state` with no further setup.

It is named with a `$` prefix for the same reason `$type` and `$key` are: it is metadata about the
resource rather than data from it, and the prefix keeps it from colliding with a real field named
`state` (a common attribute name in its own right — an order's `state`, a US `state`).

`$state` is:

- **Stable.** `record.$state === record.$state`. The derivation creates the state object once per
  record instance and memoizes it; its properties are what change.
- **Read-only.** Setting `$state` or any of its properties is an error, the same as any derived
  field.
- **Non-enumerable.** It is excluded from `Object.keys(record)`, `{ ...record }`, and
  `JSON.stringify(record)`, the same as `constructor`, so adding it to `withDefaults` doesn't
  change what apps that serialize or spread records get. `$state` itself implements `toJSON` for
  debugging.
- **Only on resources.** `withDefaults` only builds resource schemas; embedded objects
  (`schema-object`, `schema-array` members) have no lifecycle of their own and don't get `$state`.

### Properties

| Property | Source | Reactive to |
| --- | --- | --- |
| `isNew` | `cache.isNew(key)` | `'state'` notifications |
| `isDeleted` | `cache.isDeleted(key)` | `'state'` notifications |
| `isDeletionCommitted` | `cache.isDeletionCommitted(key)` | `'state'` notifications |
| `isDirty` | see below | `'state'`, `'attributes'`, `'relationships'` notifications, both channels |
| `isSaving` | a mutation for this resource is pending in the `RequestStateService` | request state subscriptions |
| `errors` | `cache.getErrors(key)` | `'errors'` notifications |
| `isValid` | `errors.length === 0` | `errors` |
| `error` | what the most recent rejected mutation for this resource rejected with, unless it was a validation failure | request state subscriptions |
| `isError` | `error !== null` | `error` |

`isDirty` is the LegacyMode `isDirty` computation, extended to relationships:

```ts
if (isDeletionCommitted || (isDeleted && isNew)) return false;
return isDeleted || isNew || cache.hasChangedAttrs(key) || cache.hasChangedRelationships(key);
```

A new resource deleted before it was ever saved, and a resource whose deletion has been
committed, have nothing left to persist, so they are not dirty.

`isDirty` listens to both the `'local'` and `'remote'` notification channels. A local edit changes
the local projection, but a remote update whose value matches a pending local edit resolves that
edit while changing only the remote projection; listening to one channel would miss one of the
two.

#### Validation failures versus request errors

LegacyMode distinguishes a save that the API rejected as invalid (`isValid: false`, populated
`errors`) from a save that failed for any other reason (`isError: true`, `adapterError`). `$state`
keeps that split:

- A mutation rejected with a JSON:API error document (`error.content.errors`), which the cache
  handler hands to `cache.commitWasRejected`, is a validation failure. It is reported through
  `errors` / `isValid` and clears `error`.
- Any other rejection sets `error` to the rejection reason and `isError` to `true`.
- A successful mutation clears `error`.

The check looks at the rejection itself rather than at `cache.getErrors`, because the cache keeps
validation errors from an earlier rejection until they are resolved, and a later network failure
should still be reported as an error.

#### Both projections share one state

A PolarisMode resource has two projections: the immutable instance and its editable checkout.
`$state` describes the *resource in the cache*, not a projection, so both report the same values:
after `editable.name = 'Christopher'`, `user.$state.isDirty` is `true` on the immutable instance
too. This is deliberate. The question "does this resource have unsaved changes" has one answer,
and the immutable instance is usually what the rest of the UI (a list row, a nav badge) is
rendering when it wants to show that answer. The immutable instance still does not *show* the
edits themselves, only that they exist.

### Lifetime

The state object subscribes to the `NotificationManager` and the `RequestStateService` for its
resource the first time `$state` is read, and unsubscribes when the record is torn down (the same
point at which the record's own notification subscription is released, including the editable
checkout when its immutable instance is torn down). A record whose `$state` is never read pays
nothing for it.

`RequestStateService` gains an internal `_unsubscribeForRecord(key, callback)` to make that
possible; today `subscribeForRecord` has no way to unsubscribe, so every LegacyMode `RecordState`
leaks its callback for the lifetime of the store. Switching `RecordState` to it is out of scope
here but is a natural follow-up.

### What is not carried over, and why

| LegacyMode | In `$state` | Why |
| --- | --- | --- |
| `isNew` | `isNew` | unchanged |
| `isDeleted` | `isDeleted` | unchanged |
| `currentState.isDeletionCommitted` / `isSaved` for deletes | `isDeletionCommitted` | the only part of `isSaved` that isn't already `!isDirty` |
| `hasDirtyAttributes`, `currentState.isDirty` | `isDirty` | one name instead of two, and it includes relationship changes |
| `isSaving` | `isSaving` | unchanged |
| `isValid` | `isValid` | unchanged |
| `errors` (an `Errors` `ArrayProxy`) | `errors` (`ApiError[]`) | the cache's JSON:API errors, no dependency on `@ember/array` or `EmberObject`; `source.pointer` identifies the field |
| `isError`, `adapterError` | `isError`, `error` | "adapter" no longer describes where errors come from |
| `isLoading`, `isLoaded`, `isEmpty`, `isReloading`, `isPreloaded` | — | a PolarisMode resource only exists once its data is in the cache; loading is a property of a *request*, and is already reactive via `getRequestState` / `<Request>` |
| `dirtyType`, `currentState.stateName` | — | string-encoded restatements of the booleans above; `stateName` exposes the long-gone state machine |
| `currentState` | — | `$state` *is* the state; there's no separate state machine object to reach into |
| `isDestroying`, `isDestroyed` | — | EmberObject lifecycle; a torn-down PolarisMode record is simply no longer returned by the store |

### TypeScript

`ReactiveResourceState` is exported as a type from `@warp-drive/core/reactive`. Apps that type
their resources by hand add it the same way they add `$type`:

```ts
import type { ReactiveResourceState } from '@warp-drive/core/reactive';

interface User {
  readonly id: string;
  readonly $type: 'user';
  readonly $state: ReactiveResourceState;
  readonly name: string;
}
```

Apps that generate types from their schemas (e.g. via the schema DSL) should get it from the same
generator that emits `$type`.

### Compatibility

`$state` is additive. Schemas not built with `withDefaults` are unaffected; schemas that are gain a
field that is non-enumerable and so does not change serialization, spreading or `Object.keys`. A
schema passed to `withDefaults` that already declares its own field named `$state` would now
collide with the added one; see Unresolved questions.

LegacyMode schemas (built with `withDefaults` from `@warp-drive/legacy/model/migration-support`)
are unchanged and keep their flat flags. `$state` is not added to them, so a resource migrating
from LegacyMode to PolarisMode moves from `record.isSaving` to `record.$state.isSaving` in the
same change that moves its schema. The table above is mechanical enough for the migration
codemods to rewrite those reads.

### Ecosystem

- **Lint rules:** none required. A rule flagging LegacyMode flag reads (`record.isNew`,
  `record.hasDirtyAttributes`) on PolarisMode resources would be a useful follow-up to the
  migration codemods.
- **DevTools / Inspector:** `$state.toJSON()` gives devtools a cheap, serializable summary of a
  resource's lifecycle to show alongside its data.
- **SSR:** no impact; `$state` holds no data that isn't already in the cache, so nothing extra
  needs to be serialized or rehydrated.

## How we teach this

`$state` is taught as part of `withDefaults`: the `@warp-drive/core/reactive` module docs'
"Utilities" section already describes what `withDefaults` adds (identity and `$type`), and
`$state` joins it with a short example and a link to the `ReactiveResourceState` API page, which
documents each flag.

The guides on editing and saving resources are where it becomes useful: an edit form that disables its
submit button while `$state.isSaving`, shows a "you have unsaved changes" prompt from
`$state.isDirty`, and renders field errors from `$state.errors` by `source.pointer`.

For users migrating from `Model`, the upgrade guide gains the "What is not carried over" table
from this RFC, framed as "if you used X, use Y", with the loading-state rows pointing to
`getRequestState` and the `<Request>` component.

The terminology deliberately matches LegacyMode wherever the meaning is unchanged, so an existing
user's vocabulary carries over; the only renames (`hasDirtyAttributes` → `isDirty`,
`adapterError` → `error`) are ones where the old name described an implementation detail.

## Drawbacks

- **One more field on every PolarisMode resource.** It is lazy and non-enumerable, so the cost is
  a schema entry until someone reads it, but it does become part of the default shape we have to
  support.
- **`$state` reports the resource, not the projection.** An app that expected the immutable
  instance to be "clean" while its checkout is being edited will be surprised. We think the shared
  answer is the more useful one, but it is a choice.
- **`isSaving` is only as precise as the `RequestStateService`.** Today the cache handler enqueues a
  mutation under the first entry of `request.records` only, so for a request that mutates several
  resources at once only the first one reports `isSaving`. This is a pre-existing limitation of
  `RequestStateService`, not something `$state` introduces, but `$state` makes it more visible.
- **A second vocabulary during migration.** Apps midway through moving from LegacyMode will read
  `record.isNew` on some resources and `record.$state.isNew` on others.

## Alternatives

- **Flat flags, as LegacyMode does.** Putting `isNew`, `isDirty`, ... directly on the resource
  would make migration a no-op for reads, but it spends nine names in the resource's own
  namespace, collides with real attributes of the same names, and conflicts with PolarisMode's
  `$`-prefixed convention for metadata.
- **A standalone function, e.g. `getResourceState(record)`.** This mirrors `getRequestState` and
  needs no schema field, so it would also work for schemas not built with `withDefaults`. It is
  less discoverable, doesn't show up in the resource's type, and still needs somewhere to keep the
  per-record state and subscription alive. It remains a reasonable addition *on top of* `$state`
  (backed by the same object), if schemas that opt out of `withDefaults` need it.
- **Reuse `RecordState` from `@warp-drive/legacy`.** It would bring the `Errors` `ArrayProxy`,
  `stateName`, and the loading flags along with it, and would make `@warp-drive/core` depend on
  `@warp-drive/legacy`.
- **Do nothing.** Apps keep re-deriving these flags from the cache, usually without reactivity and
  without releasing their subscriptions.

## Unresolved questions

- Should `withDefaults` assert in development when a schema already declares a field named
  `$state` (or `$type`, `$key`), rather than silently overriding it?
- Should `isSaving` cover every resource in a multi-record mutation? That requires the cache
  handler to enqueue one `RequestStateService` entry per entry in `request.records`, which also
  changes what LegacyMode's `isSaving` reports for those records.
- Should `$state` expose which fields are dirty (`changedFields`), or is that better served by
  `cache.changedAttrs` / `cache.changedRelationships` directly?
- Should `$state` be added to LegacyMode schemas as well, so that migrating code can switch to
  `$state` before the schema itself moves to PolarisMode?
