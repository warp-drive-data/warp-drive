---
title: Deprecating the Legacy ember-data Packages and @warp-drive/core-types
description: Proposes deprecating the ember-data package, every @ember-data/* package, and @warp-drive/core-types now, in favor of their already-shipping @warp-drive/* successors, with removal from publishing targeted for 6.0.
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
`store`, `tracking`), and `@warp-drive/core-types` are deprecated starting in the next 5.x minor,
with removal from npm publishing at 6.0. Every one of these packages is already, today, a thin
re-export shim over a `@warp-drive/*` package introduced by the package-unification effort
([emberjs/rfcs#1075](https://rfcs.emberjs.com/id/1075-warp-drive-package-unification/)) —
`@warp-drive/core`, `@warp-drive/legacy`, `@warp-drive/utilities`, `@warp-drive/json-api`, and
`@warp-drive/ember`. This RFC does not move any logic; it formalizes the deprecation of the old
import paths that RFC 1075 already implied, with concrete deprecation flags/ids and documentation
updates, landing now, on the same `since <5.x>` / `until 6.0` timeline every other active
deprecation in `deprecations.ts` already uses. The mechanical rewrite itself needs no new
tooling: `eslint-plugin-warp-drive`'s `no-legacy-imports` rule already autofixes exactly this
import rename, and already ships enabled in its `recommended` config.

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

The expected outcome: starting in the next 5.x minor, every consumer importing from a legacy
package sees a clear, actionable deprecation pointing at the exact `@warp-drive/*` replacement
import, with `eslint --fix` performing the rewrite mechanically via the already-shipping
`no-legacy-imports` rule; at 6.0, WarpDrive stops publishing new versions of the legacy packages,
and the legacy setup guide is replaced entirely by the unified one.

## Detailed design

### What's covered and what it maps to

Every legacy package's current re-export target, confirmed by reading its `src/index.ts`:

| Legacy package | Deprecated now, removed at 6.0 | Replacement |
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
| `@ember-data/debug` | No — see "Packages without a home" (keeps publishing past 6.0) | none yet |
| `@ember-data/codemods` | No — see "Packages without a home" (keeps publishing past 6.0) | n/a (unrelated to this rename — see "Automated migration") |

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
 * @since 5.11
 * @until 6.0
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
 * @since 5.11
 * @until 6.0
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
      `instead. Enable eslint-plugin-warp-drive's recommended config and run \`eslint --fix\` ` +
      `to update your imports automatically.`,
    false,
    {
      id: 'warp-drive.deprecate-ember-data-packages',
      until: '6.0.0',
      for: 'warp-drive',
      since: { enabled: '5.11.0', available: '5.11.0' },
      url: 'https://deprecations.emberjs.com/id/warp-drive.deprecate-ember-data-packages',
    }
  );
}
```

`@warp-drive/core-types`'s shim gets the equivalent call under `DEPRECATE_CORE_TYPES_PACKAGE`
with `id: 'warp-drive.deprecate-core-types-package'`. Because both flags default to `true` (the
deprecated behavior is active) exactly like every other flag in `deprecations.ts`, opting out
early — silencing the warning as soon as it ships — is not offered; unlike a behavior
deprecation, there's no "not yet migrated" code path to keep alive here, only an import path to
change.

### npm-level deprecation

Every legacy package's `package.json` `description` is updated to lead with `(Legacy)` (already
true for `@warp-drive/core-types`; not yet true for the `@ember-data/*` family or `ember-data`
itself), and at the same 5.x minor that ships the flags above, each package's npm registry entry
gets an `npm deprecate` message pointing at the migration guide (see "How we teach this"). This
is metadata only — `npm install` continues to work unchanged for every version published through
the last 5.x release; the notice surfaces immediately in `npm install` output and on the
npmjs.com package page, well ahead of the 6.0 removal.

### Automated migration

No new tooling needs to be built for the mechanical rewrite. `eslint-plugin-warp-drive` already
ships `no-legacy-imports` (`warp-drive/no-legacy-imports`), an autofixable rule enabled by
default in its `recommended` config, driven by a generated, export-level mapping table
(`public-exports-mapping-5.5.enriched.json`) that already covers every package in the table
above — including the `rest`/`active-record` split, since the mapping is per-export, not
per-module (e.g. `import { findRecord } from '@ember-data/rest/request'` already rewrites to
`import { findRecord } from '@warp-drive/utilities/rest'`). Running `eslint --fix` with
`recommended` enabled is the actual migration path this RFC relies on.

The one gap: the rule only rewrites static `import` declarations. Namespace imports,
`export * from` re-exports, CommonJS `require`, and dynamic `import()` are flagged without an
autofix and need manual migration — worth stating plainly in the migration guide rather than
implying `eslint --fix` alone finishes the job for every app. The other prerequisite is that an
app must already have `eslint-plugin-warp-drive`'s `recommended` config enabled to get the
autofix at all; the migration guide should call out enabling it as step one for apps that
haven't adopted it yet.

### Packages without a home

Two `@ember-data/*` packages have no existing `@warp-drive/*` re-export target, and this RFC does
not deprecate or stop publishing them at 6.0:

- **`@ember-data/debug`** provides the Ember Inspector data adapter. Deprecating it without a
  replacement would leave Inspector support with nowhere to go, so this RFC treats giving it a
  home in `@warp-drive/ember` (the package every Ember app already installs) as a prerequisite
  for `@ember-data/debug`'s own deprecation, tracked as follow-up work with its own timeline
  rather than folded into this RFC. Until that lands, `@ember-data/debug` remains fully
  supported and keeps publishing past 6.0.
- **`@ember-data/codemods`** hosts schema-migration codemods unrelated to this import rename —
  the rewrite itself is handled by `eslint-plugin-warp-drive`'s `no-legacy-imports` rule (see
  "Automated migration"), not by this package. It has no existing `@warp-drive/*` successor;
  this RFC leaves its disposition to a separate, future decision and it keeps publishing past
  6.0 regardless.

### Timeline

1. **Next 5.x minor:** both flags ship (default `true`); the runtime warning and npm deprecation
   metadata ship together (the `eslint-plugin-warp-drive` autofix already exists today).
   `ember-data`, every `@ember-data/*` package (except `debug` and `codemods`), and
   `@warp-drive/core-types` show a deprecation on install and on first import.
2. **Remaining 5.x betas/minors:** the warning and the `eslint --fix` autofix are the primary
   support surface; no further behavior change. This is the entire migration window — it ends at
   the next major.
3. **6.0:** WarpDrive stops publishing new versions of the deprecated packages. Versions already
   published through the last 5.x release remain installable indefinitely (npm does not support
   retracting published versions), so apps that never migrate are not broken outright — they
   simply stop receiving fixes, security patches, and compatibility updates for those packages
   from 6.0 onward.

This mirrors the `since <5.x>` / `until 6.0` shape already used by every other active flag in
`deprecations.ts` (`DEPRECATE_TRACKING_PACKAGE`, `DEPRECATE_EMBER_INFLECTOR`, and the rest) — this
RFC's flags resolve on the same release boundary, rather than opening a new post-6.0 deprecation
window the way a behavior flag typically would. The difference from a behavior flag is *what*
"resolving" means: there's no source inside a still-shipping package to delete at 6.0, because the
deprecated thing is the package's own continued publication, not code inside a package that
keeps shipping. The "removal" is that the legacy packages' own releases stop.

## How we teach this

- `guides/configuration/legacy-package-setup/index.md` gets a deprecation banner at the top
  (the page already carries a "Boilerplate Sucks" callout pointing at RFC 1075; this RFC extends
  that callout to state the deprecation is immediate and end-of-publishing lands at 6.0, plainly
  and with a date once one is set) and its package-list code blocks get inline notes next to
  each deprecated package naming its replacement.
- A new `upgrading/v6/` page (alongside the existing `upgrading/v5/`) documents the full mapping
  table from "Detailed design" as the canonical migration reference, plus how to enable
  `eslint-plugin-warp-drive`'s `recommended` config and run `eslint --fix`.
- The runtime deprecation message itself (see "Runtime warning") is the primary channel most
  developers see this through — it names the exact replacement import and the exact autofix
  command, no lookup required.
- This is taught as "finishing package unification," not as a new idea: RFC 1075 is where users
  already learned that `@warp-drive/core` is the way forward. This RFC's messaging should link
  back to it rather than introduce new terminology.

## Drawbacks

- **The migration window is short.** Deprecating now with removal at the very next major gives
  apps only the remainder of the current 5.x line to migrate, rather than a full major's worth of
  beta/minor cycles. Every other flag in `deprecations.ts` gets that same window in principle
  (`since 5.x` / `until 6.0`), but most of them were introduced earlier in the 5.x line than this
  RFC lands — apps adopting this deprecation late in 5.x genuinely have less time than apps that
  picked up, say, `DEPRECATE_TRACKING_PACKAGE` at 5.5. The existing `eslint-plugin-warp-drive`
  autofix is not optional polish here; it is load-bearing for apps to make this window — and it
  only helps apps that have already adopted the plugin's `recommended` config, which not every
  app has.
- **Two coarse flags instead of fourteen fine-grained ones** means an app can't resolve the
  deprecation for, say, just `@ember-data/model` while keeping the warning active for
  `@ember-data/rest` — it resolves the whole `ember-data` family at once. This trades precision
  for a simpler mental model matching how the packages are already documented and installed.
- **`ember-data` is the simplest onboarding path today** for tutorials and small test apps that
  don't want to reason about which of five-to-fourteen packages to install. Deprecating it raises
  the bar for a "just try it" first install, unless the unified `@warp-drive/core` install path
  is brought to at least the same one-command simplicity before 6.0 ships (tracked by the
  existing `@warp-drive/core` setup docs, not by this RFC).
- **6.0 is a lifecycle boundary for two unrelated deprecations at once.** This RFC's packages
  finish their deprecation and stop publishing at 6.0; [RFC 0002](./0002-warp-drive-build-plugin.md)'s
  babel build path only *begins* its formal deprecation at 6.0 (removed later, at 7.0). An app
  reading both at the 6.0 boundary needs to understand it's losing the legacy packages outright
  while merely being warned about the babel path — the two migration guides should say this
  explicitly rather than let the shared version number imply a shared timeline.
- **`@ember-data/debug` and `@ember-data/codemods` staying out of scope** means this RFC doesn't
  fully retire the `@ember-data/*` namespace at 6.0 — a reader could reasonably expect "deprecate
  the ember-data packages" to be complete, and it explicitly isn't for these two.

## Alternatives

- **Do nothing; keep the legacy packages fully supported indefinitely.** Rejected: it commits
  WarpDrive to documenting, testing, and versioning shim code that does nothing but re-export,
  forever, with no path to ever simplifying the package graph RFC 1075 was meant to simplify.
- **Remove the legacy packages outright, immediately, with no deprecation period.** Rejected:
  skips the standard deprecate-then-remove cycle this codebase already uses for every other
  breaking change (see every other flag in `deprecations.ts`), and would break any app that
  hasn't migrated with no warning at all.
- **Deprecate at 6.0 and remove at 7.0**, mirroring the timeline this RFC originally proposed and
  the one [RFC 0002](./0002-warp-drive-build-plugin.md) uses for the babel build path. Superseded
  in this revision: it opens a new post-6.0 deprecation window instead of resolving on the same
  `since 5.x` / `until 6.0` boundary every other flag in `deprecations.ts` already uses, and
  delays finishing RFC 1075's package unification by a full extra major for packages that have
  had a working replacement for some time.
- **Deprecate only `@warp-drive/core-types`, leave the `@ember-data/*` family alone.** Rejected:
  every `@ember-data/*` package is the same re-export-shim situation as `core-types`; singling
  out `core-types` leaves the larger and more visible part of the problem (the `ember-data`
  meta-package and its dependents) unaddressed.
- **Per-package deprecation flags (fourteen flags instead of two).** Considered and rejected for
  this RFC in favor of the coarser grouping described in "Deprecation flags" — see "Drawbacks"
  for the trade-off this gives up.
- **Build a dedicated `legacy-imports` codemod in `@ember-data/codemods`.** Considered, and
  rejected as redundant once `eslint-plugin-warp-drive`'s `no-legacy-imports` rule was found to
  already perform the identical autofixable rewrite off a generated, export-level mapping table.
  Building a second tool would mean maintaining two mapping tables for the same rename instead
  of one.

## Unresolved questions

- What `@ember-data/debug`'s new home inside `@warp-drive/ember` should look like concretely
  (auto-registered vs. opt-in import), and whether that needs its own RFC before it can be
  folded into this one's timeline on a later major.
- Whether the remaining 5.x window before 6.0 is long enough for apps to migrate given the
  existing `eslint-plugin-warp-drive` autofix, or whether this RFC's landing should be gated on
  6.0 being at least a certain number of 5.x minors away at the time it merges.
- Whether the `no-legacy-imports` mapping table (currently named/versioned as
  `public-exports-mapping-5.5.enriched.json`) needs a refresh or rename as part of this RFC, and
  what should extend it to cover namespace imports, re-exports, and `require`/dynamic `import()`
  given those are the one gap in the otherwise-automatic migration path.
- Whether `npm deprecate` notices should be applied to already-published pre-deprecation
  versions retroactively, or only to versions published at/after the flags ship.
- Final wording and placement of the `upgrading/v6/` migration page relative to the existing
  `upgrading/v5/` content.
