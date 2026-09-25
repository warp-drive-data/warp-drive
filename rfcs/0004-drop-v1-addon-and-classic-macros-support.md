---
title: 'Dropping V1 Addon and Classic ember-cli Macros Support in 6.0'
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
  - cli
prs:
  accepted:
project-link:
suite:
---

# Dropping V1 Addon and Classic ember-cli Macros Support in 6.0

## Summary

WarpDrive's 6.0 major drops two pieces of classic Ember infrastructure: the V1 addon shim
every `@warp-drive/*`/`@ember-data/*`/`ember-data` package still carries as a compatibility
fallback (`addonV1Shim` from `@embroider/addon-shim`, and the `___legacy_support` branch in
`setConfig` that exists only to receive `app.options.emberData`), and the classic ember-cli
macros configuration surface (`setConfig(app, __dirname, config)` called from
`ember-cli-build.js`, `buildMacros()` + `setConfig(macrosConfig, config)` wired by hand into
`babel.config.mjs`, and the accompanying `babel-plugin-debug-macros` entry). After 6.0, every
consumer configures WarpDrive exclusively through the bundler plugin introduced in
[RFC 0002](/rfcs/0002-warp-drive-build-plugin), and every WarpDrive package ships as a
V2-only addon with no V1 fallback. Non-embroider classic Ember builds — those without
`@embroider/compat`'s `compatBuild` in `ember-cli-build.js` — are no longer supported.

## Motivation

RFC 0002 introduced the build plugin and deprecated the babel-based configuration path, but
it deliberately kept two escape hatches alive through the 6.0 boundary to de-risk that
proposal on its own: classic ember-cli apps could keep calling
`setConfig(app, __dirname, config)` unchanged, with an automatic babel bridge the addon
wires up for them, and WarpDrive's own packages kept their `addonV1Shim` fallback so that an
app running a fully classic (non-embroider) build could still resolve them. Both of those
compatibility paths carry real, ongoing cost, and neither is doing what it was built for
anymore:

**1. The V1 shim is for a build that no longer exists in this ecosystem's supported range.**
`addonV1Shim` exists so a package written against the V2 addon spec can still be resolved by
an app that hasn't adopted embroider at all — no `ember-auto-import`-free static imports, no
`app-js`/`public-assets` conventions understood natively, broccoli trees instead. WarpDrive's
own minimum-supported Ember versions already require embroider for anything but the most
trivial app (Vite, TypeScript, and strict-mode templates all assume it), so the shim spends
real weight — `@embroider/addon-shim` as a dependency of every published package, plus the
`ember-addon.version === 1` branch in every `addon-main.cjs` deleting `treeForApp` — keeping a
code path alive for a build target the rest of WarpDrive's tooling already assumes is absent.

**2. The classic macros path is the thing RFC 0002 was written to replace.** Its own
motivation section lists the failure modes directly: a babel pipeline is a hard requirement
in ecosystems that don't have one, the wiring is easy to get wrong (`buildMacros`,
`setConfig`, `...macros()`, `...Macros.babelMacros`, and a `babel-plugin-debug-macros` entry,
each a chance to omit a piece), and multiple copies of `@embroider/macros` in a dependency
tree silently fail to coordinate. Every one of those problems still exists as long as the
classic path is reachable at all — a deprecation warning does not remove a footgun, it just
labels it. The `___legacy_support` branch in `setConfig` (`warp-drive-packages/build-config/src/index.ts`)
exists solely to reconcile `app.options.emberData` (read by the V1 shim's `included` hook)
against an app that also calls `setConfig` directly — a reconciliation step whose only job is
supporting the path this RFC removes.

**3. Two supported configuration paths is a permanent maintenance and documentation tax.**
`guides/configuration/index.md` currently carries three tabs — Simple Config, Advanced
Config, Ember Apps (classic) — for what is conceptually one operation: hand WarpDrive its
config object. Every new `WarpDriveConfig` option, every bug in config resolution, and every
support question has to account for three wiring shapes instead of one. RFC 0002 already
unified Simple/Advanced Config into the plugin; this RFC finishes the job by retiring the
third.

The expected outcome: one configuration surface (the build plugin, with `compatWith` and
friends), one addon format (V2), `@embroider/macros` and `@embroider/addon-shim` off every
WarpDrive package's dependency list, and a support matrix that no longer has to reason about
classic (non-embroider) Ember builds at all.

## Detailed design

### What "V1 addon support" means here, precisely

Every `@warp-drive/*`, `@ember-data/*`, and `ember-data` package ships `addon-main.cjs`
built on:

```js
'use strict';
const { addonShim } = require('@warp-drive/core/addon-shim.cjs'); // re-exports addonV1Shim
const addon = addonShim(__dirname);
const pkg = require('./package.json');
if (pkg['ember-addon'].version === 1) {
  delete addon.treeForApp;
}
```

`addonV1Shim` (from `@embroider/addon-shim`) is what lets a package written to the V2 addon
spec — no `index.js` addon class, no broccoli trees, just `app-js`/`public-assets` in
`package.json` — still resolve correctly for an ember-cli consumer that predates embroider's
V2 addon support. Every WarpDrive package already declares `"ember-addon": { "version": 2,
... }`; the `version === 1` branch is dead in practice today because nothing in the published
packages sets `version: 1`, but the shim itself, and the `included` hook it wraps (used to
funnel `app.options.emberData` into `setConfig` — see next section), stay live and load on
every classic-build consumer regardless.

At 6.0:

- `addon-main.cjs` is replaced by a plain V2 addon manifest with no shim, no `included`
  hook, and no runtime branch on `ember-addon.version`.
- `@embroider/addon-shim` is removed from every WarpDrive package's dependencies.
- Consuming a WarpDrive package requires an embroider-compatible resolution (V2 addon
  support), whether that's a Vite build via `@embroider/vite`, or `compatBuild` from
  `@embroider/compat` in a still-broccoli-based `ember-cli-build.js`. A fully classic build —
  no embroider anywhere in the pipeline — cannot resolve WarpDrive packages at all, the same
  way it already cannot resolve any other V2-only addon in the ecosystem.

### What "classic ember-cli macros config" means here, precisely

Three call shapes, all accepted by `setConfig` today
(`warp-drive-packages/build-config/src/index.ts`), are removed:

1. **The 3-argument classic form**, called from `ember-cli-build.js`:

   ```js
   setConfig(app, __dirname, { compatWith: '4.12', deprecations: { /* ... */ } });
   ```

   This is `isEmberClassicUsage` in `setConfig`'s implementation — it calls
   `_MacrosConfig.for(context, appRoot)` to look up (or create) the app's embroider macros
   config by side effect, rather than receiving one directly.

2. **The `___legacy_support` reconciliation branch**, reached only through the V1 shim's
   `included` hook, which calls `setConfig(app, dirname, { ...app.options?.emberData,
   ___legacy_support: true })` on every app regardless of whether that app configured
   WarpDrive at all. This exists purely to support option (1) via the older
   `app.options.emberData` key and to throw a clear error if both that key and a direct
   `setConfig` call are present at once.

3. **The 2-argument advanced form** aimed at a hand-rolled `buildMacros()` instance:

   ```js
   const Macros = buildMacros({ configure: (config) => setConfig(config, { compatWith: '5.7' }) });
   ```

   paired with a manually-added `babel-plugin-debug-macros` entry to convert
   `deprecate`/`warn` calls, and `...Macros.babelMacros` in the babel plugin list.

At 6.0, `setConfig` keeps exactly one signature:

```ts
export function setConfig(config: WarpDriveConfig): void;
```

which registers the config directly on the build plugin's registry (the mechanism RFC 0002
describes under "One config, no matter how many copies") — no `MacrosConfig`, no
`buildMacros`, no app/context object, no `appRoot` string. `setConfig` becomes a thin wrapper
that plugin users don't even need to call directly; passing the same options object to
`warpDrive.vite(options)` (or the adapter for whichever bundler) does the same thing.

Calling `setConfig` with 2 or 3 arguments, or calling `buildMacros`/`babelPlugin` from
`@warp-drive/core/build-config`, throws synchronously at build configuration time (not a
runtime deprecation warning — by 6.0 these entry points no longer exist in the published
type signatures or the compiled output) with a message pointing at the migration guide:

```
Error: setConfig() no longer accepts an ember-cli `app` object or `appRoot` string as of
WarpDrive 6.0. Configure WarpDrive through the build plugin instead:

  // vite.config.mjs
  import { warpDrive } from '@warp-drive/core/build-plugin';
  plugins: [...ember(), warpDrive.vite({ compatWith: '5.7' })]

Migration guide: https://docs.warp-drive.io/guides/build-plugin-migration
```

`babelPlugin()`, the `macros()` helper, and the documented `babel-plugin-debug-macros` entry
are removed from `@warp-drive/core/build-config`'s exports entirely; importing them is a
module-resolution error, not a runtime warning.

### Relationship to RFC 0002's deprecation schedule

RFC 0002 proposed:

> 3. **Next major (6.0):** the babel path issues a formal build-time deprecation ... 4.
>    **Following major (7.0):** the babel path is removed. A babel *bridge* plugin ... remains
>    available indefinitely.

and left as an unresolved question whether the classic ember-cli story at 6.0 could rely on
an automatically-injected babel bridge, gated behind a flag for the full 6.0 beta cycle.

This RFC supersedes that part of RFC 0002's schedule: there is no babel bridge, at 6.0 or
later, and no flag gating a fallback — the classic path and the V1 shim are removed in the
same major that introduced the plugin's deprecation notice, rather than one major later. The
rest of RFC 0002 — the plugin's design, its per-bundler adapters, the config-registry
conflict detection, and the plain-flag published-output format — is unaffected and remains
this RFC's dependency. Concretely, this RFC turns RFC 0002's step 3 into a hard break instead
of a warning:

1. **Next 5.x minor:** unchanged from RFC 0002 — plugin ships, fully supported alongside the
   classic path, which prints nothing yet.
2. **Following 5.x minor:** unchanged from RFC 0002 — the classic path prints a one-time
   build notice.
3. **Last 5.x minor before 6.0:** the classic path's notice is upgraded to a formal
   deprecation (`warp-drive.legacy-babel-config`, as specified in RFC 0002), and a second,
   separate deprecation (`warp-drive.v1-addon-support`) is added for the V1 shim path,
   triggered whenever the `included` hook's `___legacy_support` branch actually runs (i.e.
   whenever an app is resolving WarpDrive through anything other than embroider's V2 addon
   support).
4. **6.0:** both are removed, per the "Detailed design" section above. There is no bridge and
   no flag; an app that has not migrated by 6.0's release fails at build configuration time
   with the error message shown above, and (if it is on a fully classic, non-embroider build)
   fails to resolve WarpDrive's packages at all.

### Ecosystem implications

- **Addons that depend on WarpDrive** and use the classic `setConfig(app, __dirname, ...)`
  form in their own `index.js` `included` hook (a pattern several community addons copied
  from WarpDrive's own guides before the plugin existed) break at 6.0 the same way an app
  would, and need the same migration.
- **Ember Engines:** unaffected beyond the general migration — engines already resolve V2
  addons through the host app's embroider pipeline.
- **Blueprints:** the app blueprint's WarpDrive wiring, already updated to the plugin recipe
  under RFC 0002, drops the classic `ember-cli-build.js` tab entirely rather than marking it
  deprecated.
- **Lint rules:** none required; there is no runtime API surface change, only a build-time
  configuration one.
- **`@embroider/macros` and `@embroider/addon-shim`** both leave every WarpDrive package's
  `dependencies`, completing the removal RFC 0002 scheduled for WarpDrive's published output
  format.

## How we teach this

The setup guide (`guides/configuration/index.md`) drops the "Ember Apps" (classic) tab
introduced under RFC 0002's interim period, leaving a single build-plugin recipe per bundler
— there is no longer a paradigm switch to teach at all, only "add this plugin to your
bundler config." The legacy package setup guide
(`guides/configuration/legacy-package-setup/`) is retitled to make clear it documents the 5.x
migration path, not a currently-supported configuration.

The upgrade guide for 6.0 (`upgrading/v6/index.md`) gets a dedicated section listing, in
order: (1) confirm the app builds through embroider (Vite or `compatBuild`) rather than a
fully classic pipeline — a prerequisite independent of WarpDrive; (2) replace any
`setConfig(app, __dirname, ...)` / `buildMacros()` wiring with the plugin call shown above;
(3) delete the now-unused `@embroider/macros`, `babel-plugin-debug-macros`, and
`babel.config.mjs` entries that existed only for WarpDrive. Because the 5.x deprecation
schedule in the previous section gives both deprecation IDs (`warp-drive.legacy-babel-config`
and `warp-drive.v1-addon-support`) real build-time messages before 6.0 ships, most apps
should reach 6.0 having already completed this migration rather than discovering it as a
breaking change.

## Drawbacks

- **Faster break than RFC 0002 originally proposed.** RFC 0002 explicitly kept a bridge
  through 6.0 to avoid forcing classic-build apps to adopt embroider in the same release that
  introduces the plugin. This RFC accepts that a small number of apps genuinely still running
  a fully classic (non-embroider) build will need to adopt embroider *and* migrate their
  WarpDrive config in the same major, rather than two separate majors apart.
- **No escape hatch.** Unlike the 7.0 "babel bridge remains available indefinitely" promise
  in RFC 0002, this RFC leaves no supported way to configure WarpDrive without the bundler
  plugin, and no supported way to resolve WarpDrive packages without embroider's V2 addon
  support, once 6.0 ships.
- **Community addons that copied the classic recipe** from WarpDrive's own older guides (the
  "Advanced Config" tab) inherit this break even if they never touch WarpDrive's plugin
  themselves, since their own `included` hooks call the same removed `setConfig` shape.

## Alternatives

- **Keep RFC 0002's original schedule** (deprecate at 6.0, remove at 7.0 with an indefinite
  babel bridge). Rejected here because it keeps every problem in the Motivation section
  reachable for one more full major, and keeps `@embroider/macros` and `@embroider/addon-shim`
  in WarpDrive's dependency tree that much longer.
- **Drop only the classic macros config, keep the V1 shim.** Rejected: the V1 shim's
  `included` hook is what feeds `app.options.emberData` into the classic `setConfig` path in
  the first place, so removing one without the other leaves a live entry point into code this
  RFC deletes.
- **Drop only the V1 shim, keep classic macros config for embroider-based classic builds.**
  Considered, since `compatBuild` apps without Vite could theoretically keep calling
  `setConfig(app, __dirname, ...)` while still resolving WarpDrive as a V2 addon. Rejected for
  consistency: RFC 0002's plugin already supports `compatBuild` pipelines (it runs ahead of
  babel regardless of bundler), so there is no build shape left that needs the classic
  signature once the plugin exists — keeping it only prolongs the two-paths maintenance cost
  this RFC exists to end.
- **Ship the flag-gated automatic babel bridge from RFC 0002's unresolved question, then
  remove it later.** Rejected: building and testing an automatic bridge (detecting the app's
  babel setup and injecting compatible config) is nontrivial work for a path this RFC
  proposes to delete outright; the effort is better spent on migration tooling (a codemod, see
  Unresolved questions) that gets apps off the classic path rather than papering over it.

## Unresolved questions

- Whether a codemod should ship alongside the 6.0 release (or earlier, during the deprecation
  period) that rewrites a classic `ember-cli-build.js` `setConfig` call and a `babel.config.mjs`
  `buildMacros`/`setConfig` pair into the equivalent plugin call automatically, versus leaving
  this as a documented manual migration.
- Whether the `warp-drive.v1-addon-support` deprecation can be made precise enough to fire
  only for apps that would actually fail at 6.0 (i.e. those without embroider V2 addon
  resolution), as opposed to firing for every app that hasn't explicitly opted into the
  plugin yet, which would over-warn compatBuild-based apps that face no V1-addon break at all.
- How long the legacy package setup guide should stay published as a historical reference
  for teams mid-upgrade, versus being removed once 6.0 is released.
