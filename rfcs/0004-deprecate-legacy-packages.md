---
title: Deprecating the Legacy ember-data Packages and @warp-drive/core-types
description: Proposes deprecating the ember-data package, every @ember-data/* package, and @warp-drive/core-types at 6.0 in favor of their already-shipping @warp-drive/* successors, with removal targeted for 7.0.
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
  - learning
prs:
  accepted:
project-link:
suite:
---

# Deprecating the Legacy ember-data Packages and @warp-drive/core-types

## Summary

The `ember-data` package, every `@ember-data/*` package (`active-record`, `adapter`, `debug`,
`graph`, `json-api`, `legacy-compat`, `model`, `request`, `request-utils`, `rest`, `serializer`,
`store`, `tracking`), and `@warp-drive/core-types` are deprecated starting at 6.0, with removal
from npm publishing targeted for 7.0. Every one of these packages is already, today, a thin
re-export shim over a `@warp-drive/*` package introduced by the package-unification effort
([emberjs/rfcs#1075](https://rfcs.emberjs.com/id/1075-warp-drive-package-unification/)) —
`@warp-drive/core`, `@warp-drive/legacy`, `@warp-drive/utilities`, `@warp-drive/json-api`, and
`@warp-drive/ember`. This RFC does not move any logic; it formalizes the deprecation of the old
import paths that RFC 1075 already implied, with concrete deprecation flags/ids, a codemod, a
timeline, and documentation updates, all landing in 6.0.

## Motivation

RFC 1075 unified WarpDrive's packages so that an app installs `@warp-drive/core` and a small
number of framework/feature packages instead of assembling a dozen `@ember-data/*` packages by
hand. That work is done: every legacy package's `src/index.ts` is now nothing but a re-export.
For example:

```ts
// packages/store/src/index.ts
export { Store as default } from '@warp-drive/core';
```

```ts
// packages/core-types/src/index.ts
export type * from '@warp-drive/core/types';
```

Despite this, the legacy packages are still published, versioned in lockstep with everything
else, documented as a first-class install path (`guides/configuration/legacy-package-setup`
still lists `@ember-data/store`, `@ember-data/request`, `@warp-drive/core-types`, etc. as "the
current setup"), and tested as if they were independent implementations. Carrying two import
paths to the same code indefinitely means:

- **Doubled documentation and onboarding surface.** New users following the legacy setup guide
  learn a five-to-fourteen-package install command for functionality that `@warp-drive/core`
  (plus at most `@warp-drive/ember`) already provides in one or two packages.
- **A confusing dependency graph for tooling.** Bundlers, TypeScript, and vite in particular
  handle the `ember-data` meta-package's automatic dependency bundling poorly (already called
  out in the legacy setup guide's own "What about the `ember-data` package?" section) — the
  fix has existed since RFC 1075 shipped, but nothing tells an app it should stop relying on the
  meta-package.
- **No signal that the shims are temporary.** `@warp-drive/core-types`'s package description
  already says `(Legacy)`, but nothing else — no build-time warning, no npm deprecation notice,
  no migration guide — tells a consumer that importing from `@ember-data/model` instead of
  `@warp-drive/legacy/model` is a choice with an expiration date.

The expected outcome: by 6.0, every consumer importing from a legacy package sees a clear,
actionable deprecation pointing at the exact `@warp-drive/*` replacement import, with a codemod
that performs the rewrite mechanically; by 7.0, WarpDrive stops publishing new versions of the
legacy packages, and the legacy setup guide is replaced entirely by the unified one.

## Detailed design

### What's covered and what it maps to

Every legacy package's current re-export target, confirmed by reading its `src/index.ts`:

| Legacy package | Deprecated at 6.0 | Replacement |
| --- | --- | --- |
| `ember-data` | Yes | `@warp-drive/core` (+ `@warp-drive/ember` for Ember apps, `@warp-drive/legacy` for Model/Adapter/Serializer) |
| `@warp-drive/core-types` | Yes | `@warp-drive/core/types` |
| `@ember-data/store` | Yes | `@warp-drive/core` |
| `@ember-data/graph` | Yes | `@warp-drive/core` (`/graph`) |
| `@ember-data/request` | Yes | `@warp-drive/core/request` |
| `@ember-data/request-utils` | Yes | `@warp-drive/utilities` (`/handlers`, `/string`) |
| `@ember-data/json-api` | Yes | `@warp-drive/json-api` |
| `@ember-data/model` | Yes | `@warp-drive/legacy/model` |
| `@ember-data/adapter` | Yes | `@warp-drive/legacy/adapter` |
| `@ember-data/serializer` | Yes | `@warp-drive/legacy/serializer` |
| `@ember-data/legacy-compat` | Yes | `@warp-drive/legacy/compat` |
| `@ember-data/rest` | Yes | `@warp-drive/utilities/rest` + `@warp-drive/legacy` (`/adapter/rest`, `/serializer/rest`) |
| `@ember-data/active-record` | Yes | `@warp-drive/utilities/active-record` |
| `@ember-data/tracking` | Already deprecated (`DEPRECATE_TRACKING_PACKAGE`, since 5.5, until 6.0) | `@warp-drive/ember/install` |
| `@ember-data/debug` | Blocked — see "Packages without a home" | none yet |
| `@ember-data/codemods` | Not deprecated by this RFC — see "Packages without a home" | n/a (becomes the delivery vehicle for the codemod below) |

`@ember-data/tracking` already has a resolved deprecation story under `DISABLE_7X_DEPRECATIONS`'s
sibling flags and is unaffected by this RFC beyond being folded into the same messaging pass.

### Deprecation flags

Two new flags are added to `warp-drive-packages/build-config/src/deprecations.ts`, following the
existing shape (`DEPRECATE_TRACKING_PACKAGE`, `DEPRECATE_EMBER_INFLECTOR`, etc.):

```ts
/**
 * <Badge type="warning" text="warp-drive:deprecate-core-types-package" />
 *
 * Deprecates `@warp-drive/core-types`, which has been a pure type re-export
 * of `@warp-drive/core/types` since its unification. Import types directly
 * from `@warp-drive/core/types` instead.
 *
 * @since 6.0
 * @until 7.0
 * @public
 */
export const DEPRECATE_CORE_TYPES_PACKAGE: boolean = true;

/**
 * <Badge type="warning" text="warp-drive:deprecate-ember-data-packages" />
 *
 * Deprecates the `ember-data` package and every `@ember-data/*` package
 * (`active-record`, `adapter`, `graph`, `json-api`, `legacy-compat`,
 * `model`, `request`, `request-utils`, `rest`, `serializer`, `store`).
 * Each is a re-export shim over a `@warp-drive/*` package; import from the
 * `@warp-drive/*` package directly instead.
 *
 * @since 6.0
 * @until 7.0
 * @public
 */
export const DEPRECATE_EMBER_DATA_PACKAGES: boolean = true;
```

The two flags stay coarse-grained (one for `core-types`, one for the whole `ember-data` family)
rather than one flag per package, matching how the legacy setup guide already treats the family
as a single install decision ("What about the `ember-data` package?"). Fourteen near-identical
per-package flags would multiply the deprecation surface without giving apps a meaningfully
different way to resolve them — the fix is the same import rewrite in every case.

### Runtime warning

Each legacy package's shim entrypoint gains a one-time `deprecate()` call, guarded by its flag,
following the same shape as `packages/store/src/index.ts`'s existing
`DEPRECATE_TRACKING_PACKAGE` check:

```ts
if (DEPRECATE_EMBER_DATA_PACKAGES) {
  deprecate(
    `Importing from '@ember-data/model' is deprecated. Import from '@warp-drive/legacy/model' ` +
      `instead. Run \`npx @ember-data/codemods legacy-imports\` to update your imports ` +
      `automatically.`,
    false,
    {
      id: 'warp-drive.deprecate-ember-data-packages',
      until: '7.0.0',
      for: 'warp-drive',
      since: { enabled: '6.0.0', available: '6.0.0' },
      url: 'https://deprecations.emberjs.com/id/warp-drive.deprecate-ember-data-packages',
    }
  );
}
```

`@warp-drive/core-types`'s shim gets the equivalent call under `DEPRECATE_CORE_TYPES_PACKAGE`
with `id: 'warp-drive.deprecate-core-types-package'`. Because both flags default to `true` (the
deprecated behavior is active) exactly like every other flag in `deprecations.ts`, opting out
early — silencing the warning before 6.0 ships — is not offered; unlike a behavior deprecation,
there's no "not yet migrated" code path to keep alive here, only an import path to change.

### npm-level deprecation

Every legacy package's `package.json` `description` is updated to lead with `(Legacy)` (already
true for `@warp-drive/core-types`; not yet true for the `@ember-data/*` family or `ember-data`
itself), and at the 6.0 publish, each package's npm registry entry gets an `npm deprecate`
message pointing at the migration guide (see "How we teach this"). This is metadata only —
`npm install` continues to work unchanged for every version published through 7.0; the notice
surfaces in `npm install` output and on the npmjs.com package page.

### The codemod

`@ember-data/codemods` already exists as WarpDrive's home for mechanical migrations. It gains a
new codemod, `legacy-imports`, that rewrites the import specifiers in the left column of the
table above to the ones in the right column, verbatim — this is a pure module-path rename for
every export; no export is renamed or restructured as part of this RFC. The `rest` and
`active-record` split (a single legacy package's exports now come from two `@warp-drive/*`
packages) is the one case the codemod must special-case per-export rather than per-module.

### Packages without a home

Two `@ember-data/*` packages have no existing `@warp-drive/*` re-export target, and this RFC does
not deprecate them:

- **`@ember-data/debug`** provides the Ember Inspector data adapter. Deprecating it without a
  replacement would leave Inspector support with nowhere to go, so this RFC treats giving it a
  home in `@warp-drive/ember` (the package every Ember app already installs) as a prerequisite
  for `@ember-data/debug`'s own deprecation, tracked as follow-up work rather than folded into
  this RFC's 6.0 timeline. Until that lands, `@ember-data/debug` remains fully supported.
- **`@ember-data/codemods`** is dev-tooling invoked once during migration, not a runtime
  dependency an app ships — and this RFC makes it the delivery vehicle for the `legacy-imports`
  codemod above, so deprecating it now would work against the RFC's own migration path. Its
  disposition is deferred to whenever the migration window this RFC opens eventually closes.

### Timeline

1. **6.0:** both flags ship (default `true`); the runtime warning, npm deprecation metadata, and
   `legacy-imports` codemod all ship together. `ember-data`, every `@ember-data/*` package
   (except `debug`), and `@warp-drive/core-types` show a deprecation on install and on first
   import.
2. **6.x betas/minors:** the warning and codemod are the primary support surface; no further
   behavior change.
3. **7.0:** WarpDrive stops publishing new versions of the deprecated packages. Versions already
   published through 6.x remain installable indefinitely (npm does not support retracting
   published versions), so apps that never migrate are not broken outright — they simply stop
   receiving fixes, security patches, and compatibility updates for those packages past 6.x.

This is a publishing cutoff, not a code-deletion step: unlike a behavior flag such as
`DEPRECATE_TRACKING_PACKAGE`, there is no source inside a still-shipping package to delete at
7.0 — the "removal" is that the legacy packages' own release stops.

## How we teach this

- `guides/configuration/legacy-package-setup/index.md` gets a deprecation banner at the top
  (the page already carries a "Boilerplate Sucks" callout pointing at RFC 1075; this RFC extends
  that callout to state the 6.0 deprecation / 7.0 end-of-publishing dates plainly) and its
  package-list code blocks get inline notes next to each deprecated package naming its
  replacement.
- A new `upgrading/v6/` page (alongside the existing `upgrading/v5/`) documents the full mapping
  table from "Detailed design" as the canonical migration reference, plus the codemod command.
- The runtime deprecation message itself (see "Runtime warning") is the primary channel most
  developers see this through — it names the exact replacement import and the exact codemod
  command, no lookup required.
- This is taught as "finishing package unification," not as a new idea: RFC 1075 is where users
  already learned that `@warp-drive/core` is the way forward. This RFC's messaging should link
  back to it rather than introduce new terminology.

## Drawbacks

- **Two coarse flags instead of fourteen fine-grained ones** means an app can't resolve the
  deprecation for, say, just `@ember-data/model` while keeping the warning active for
  `@ember-data/rest` — it resolves the whole `ember-data` family at once. This trades precision
  for a simpler mental model matching how the packages are already documented and installed.
- **`ember-data` is the simplest onboarding path today** for tutorials and small test apps that
  don't want to reason about which of five-to-fourteen packages to install. Deprecating it raises
  the bar for a "just try it" first install, unless the unified `@warp-drive/core` install path
  is brought to at least the same one-command simplicity before 6.0 ships (tracked by the
  existing `@warp-drive/core` setup docs, not by this RFC).
- **Sequencing with the build-plugin deprecation** ([RFC 0002](./0002-warp-drive-build-plugin.md)):
  both RFCs put a deprecation notice in front of apps at 6.0. Landing both in the same release
  means an app on the old babel-based, multi-package setup can see two unrelated deprecation
  warnings at once; the migration guide for each should cross-reference the other so an app
  doing one migration isn't confused into thinking it must also do the other in the same pass.
- **`@ember-data/debug` and `@ember-data/codemods` staying out of scope** means this RFC doesn't
  fully retire the `@ember-data/*` namespace at 6.0 — a reader could reasonably expect "deprecate
  the ember-data packages" to be complete, and it explicitly isn't for these two.

## Alternatives

- **Do nothing; keep the legacy packages fully supported indefinitely.** Rejected: it commits
  WarpDrive to documenting, testing, and versioning shim code that does nothing but re-export,
  forever, with no path to ever simplifying the package graph RFC 1075 was meant to simplify.
- **Remove the legacy packages outright at 6.0 instead of deprecating them.** Rejected: skips the
  standard deprecate-then-remove cycle this codebase already uses for every other breaking
  change (see every other flag in `deprecations.ts`), and would break any app that hasn't
  migrated with no warning period.
- **Deprecate only `@warp-drive/core-types`, leave the `@ember-data/*` family alone.** Rejected:
  every `@ember-data/*` package is the same re-export-shim situation as `core-types`; singling
  out `core-types` leaves the larger and more visible part of the problem (the `ember-data`
  meta-package and its dependents) unaddressed.
- **Per-package deprecation flags (fourteen flags instead of two).** Considered and rejected for
  this RFC in favor of the coarser grouping described in "Deprecation flags" — see "Drawbacks"
  for the trade-off this gives up.

## Unresolved questions

- What `@ember-data/debug`'s new home inside `@warp-drive/ember` should look like concretely
  (auto-registered vs. opt-in import), and whether that needs its own RFC before this one's
  6.0 timeline can include it.
- Whether `npm deprecate` notices should be applied to already-published pre-6.0 versions
  retroactively, or only to versions published at/after 6.0.
- Final wording and placement of the `upgrading/v6/` migration page relative to the existing
  `upgrading/v5/` content.
