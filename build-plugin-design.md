# `@warp-drive/build` — A Framework-Agnostic Build Plugin

**Status:** design proposal
**Scope:** replace the app-facing `@embroider/macros` + babel build path with one unplugin-based
plugin that runs under Vite, Rollup, Rolldown, Webpack, Rspack, and esbuild, serving React, Vue,
Svelte, Angular, and Ember (embroider-vite and classic) apps — while every already-published
`@warp-drive/*` / `@ember-data/*` release keeps working.

This document is the synthesis of a five-track research pass over the repository and
`node_modules` (published-dist macro inventory, `@embroider/macros@1.20.6` internals,
unplugin/parser toolbox, consumer configuration surface, runtime-toggle semantics), three
independently-authored candidate designs, and a three-lens adversarial judging pass. Verified
facts below cite real files; counts come from grep over built `dist/` output.

---

## 0. Executive summary

Ship a new **sibling package `@warp-drive/build`** (unplugin-based, per-bundler subpath exports).
It is not a literal drop-in — there is no existing bundler-plugin API to swap under; today's app
path is a babel config — but it is *adoption-drop-in*: existing `setConfig()` call sites keep
working as config sources, every already-published dist is consumed as-is, and adoption for a
Vite app is "add one plugin line, delete the babel scaffolding."

The pragmatic insight that makes this low-risk: **nothing about WarpDrive's published dist has to
change for the plugin to be useful on day one.** The published macro surface is a small, closed,
rigidly-shaped grammar (§2) that WarpDrive's own publish pipeline is the only author of. A plugin
that speaks that grammar replaces the entire app-side babel stack — the `@embroider/macros` babel
plugin, `babel-plugin-debug-macros`, and the warp-drive flag transforms (`macros()`'s five
plugin entries) — against already-published 5.x dists.

| Release | Type | What ships | Dist carrier | Who must change |
|---|---|---|---|---|
| **5.x "A"** (e.g. 5.9) | minor | `@warp-drive/build` v1 (legacy embroider shapes + `@ember/debug` + app-code flag imports); `@warp-drive/build-config` patch: neutral config store bridge in `setConfig`; coherent runtime defaults + `-seed` module + `runtime-debug` module in the flag modules | unchanged (embroider shapes) | nobody (opt-in) |
| **5.x "B"** (the following minor) | minor | Docs flip: unplugin is the default recipe for every non-classic environment; `babelPlugin()` bugfix (its `js` array finally spreads `...macros()` — the five plugin entries Simple-Config users were always missing); soft one-time info log on the babel path | unchanged | nobody forced |
| **6.0** | major | Dist flips to the **neutral carrier ("Carrier v2", §7)**; `@embroider/macros` and `@ember/debug` leave runtime package deps; classic ember served by an addon-main-injected first-party babel plugin (env-flag-baked through the whole beta) | Carrier v2 | classic apps: nothing if the injection bakes green; babel-path holdouts swap `Macros.babelMacros` for one first-party plugin |
| **6.x** | minors | `@warp-drive/build-config` folds into `@warp-drive/build/legacy`; the legacy-shape engine is retained indefinitely (~small, lets 6.x apps consume 5.x dists) | Carrier v2 | — |

The critical coexistence property (§6): **during the entire transition an app may have both the
babel/embroider path and the unplugin wired, in either order, and gets equivalent output** —
because both read one config store (the patched `setConfig` dual-writes), and each pass is a
no-op on the other's output. Scope: either-order equivalence and conflict detection require the
release-"A" `@warp-drive/build-config` patch on the babel side; with an older installed
build-config, `setConfig` never reaches the neutral store, so only the unplugin-first ordering
(the default — `enforce: 'pre'`) is guaranteed, and the plugin warns when it detects a
resolvable-but-unpatched build-config alongside an embroider pass.

### Non-negotiable correctness requirements (each traceable to a verified failure mode)

1. The Vite adapter **must** push `optimizeDeps.exclude` entries for every installed package
   matching the ownership allowlist (`@warp-drive/*`, `@ember-data/*`, `ember-data`,
   `warp-drive`). Vite's dep optimizer does not run user plugins; without the exclusion,
   `vite dev` pre-bundles the dists with live `@embroider/macros` imports whose runtime entry
   throws on the first macro call (`@embroider/macros/src/index.js` — every macro is a
   build-time-only stub). Two implementation constraints: Vite's `exclude` is
   **exact-name matching** (`moduleListContains`: string equality or prefix-with-slash), so
   glob entries like `'@warp-drive/*'` match nothing — the adapter must **enumerate concrete
   installed package names** (resolve the ownership patterns against the app's dependency
   graph at `configResolved`); and the repo's own test apps only run `vite build`, which is
   why this class of bug is currently invisible — a **dev-server integration test asserting
   the enumerated exclusion list is part of the definition of done** (`@embroider/vite` makes
   the same move for the single exact name `@embroider/macros`).
2. File ownership is decided by a **package.json name walk, never a path regex**. Vite resolves
   symlinks by default, so workspace/linked installs realpath outside `node_modules` and any
   `/node_modules/@warp-drive/` regex silently fails — shipping raw throwing macros to monorepo
   consumers.
3. The legacy-pass gate is **ownership + the `@embroider/macros` marker only**. Requiring a
   `getGlobalConfig().WarpDrive` substring skips real files: `packages/-ember-data/dist/index.js`
   imports only `dependencySatisfies`/`importSync`/`macroCondition` (zero `getGlobalConfig`).
4. All `@ember/debug` handling happens **at transform time (import deletion plus an inlined
   shim preamble in dev; call deletion in prod), never via a `resolveId` hook** — loader-only
   hosts (Turbopack) have no `resolveId`, and non-ember apps (Next) are exactly the ones with
   no runtime `@ember/debug` (36 dist files import it).
5. The dist carrier **never flips in a minor**. A minor flip silently strips production
   optimization from classic-ember and stale-babel-path apps (asserts live in prod, deprecated
   paths retained) behind nothing but a console warning. Carrier flips are semver-major.

---

## 1. Verified ground truth (what the plugin must handle)

### 1.1 The published macro grammar is closed and finite

From the exhaustive inventory of every built `dist/` under `warp-drive-packages/*` and
`packages/*`. Scope note: this inventory is over the **current workspace dist**; the grammar
has been stable since the `babel-plugin-transform-*` publish rewrite landed, but verifying it
against representative *published tarballs* (4.12, 5.3–5.6) is an explicit release-"A" gate
(§8.1) before "works against every published release" is claimed as fact rather than tested
hypothesis.

- **Exactly 7 distinct `@embroider/macros` import statements** (all ESM named imports), across
  15 packages that ship macro-bearing dist (a 16th, `@warp-drive/build-config`, references
  `@embroider/macros` only via node-side deep imports and doc comments — irrelevant to the
  transform). `@warp-drive/holodeck` ships macros **without even listing `@embroider/macros`
  as a dependency** (latent bug the new plugin's ownership rule fixes for its users).
- **`getGlobalConfig()` is always zero-argument** — every occurrence is
  `getGlobalConfig().WarpDrive.<group>.<flag>`; the string-arg form does not exist in dist.
  Groups: `env` (851 reads, dominated by `env.DEBUG`), `activeLogging` (93), bare `debug` (93,
  the runtime-logging inner reads), `deprecations` (49), `features` (5), plus bare
  `.polyfillUUID`, `.includeDataAdapter`, `.compatWith` (1 each).
- **1007 `macroCondition(...)` sites in exactly 4 argument shapes** (plain chain ×978, single
  `!`-negated chain ×22, `dependencySatisfies(...)` ×5, `moduleExists(...)` ×2) and **11
  grammatical placements**: block-`if`, single-statement-`if` (consequent may be an assignment
  or even another macro expression), `else if`, bare-`else` expression body, logical-AND
  statement, `return`-ternary, initializer ternary, **nested ternary** (a `macroCondition`
  inside a `macroCondition` branch: `src-C0Cibcpn.js:3852`), argument-position ternary,
  `??`-RHS ternary, and module-top-level `if`. No compound boolean predicates, no `while`/
  `for`/`switch` positions. Critically, **statement-level macros also nest inside other
  macros' kept branches**: `packages/-ember-data/dist/store.js:39-55`
  (`if (mc(!ENABLE_LEGACY_REQUEST_METHODS)) <assert-&&-statement>; else { deprecate(...); ... }`
  — note the `else` arm), `warp-drive-packages/json-api/dist/index.js:904-913` (negated
  double-if shapes containing a nested `mc(!features.X)` statement), and
  `packages/store/dist/index.js:163-171` (a top-level `if (mc(DEPRECATE_TRACKING_PACKAGE))`
  block containing `dependencySatisfies` ifs and `importSync`). These composites are why the
  statement-resolution rule must be removal-based (§4.3), and they belong in the golden
  corpus.
- **691 assert sites**, all the same rolldown-simplified logical-AND shape
  `macroCondition(getGlobalConfig().WarpDrive.env.DEBUG) && ((test) => { if (!test) throw new Error(...) })(<pred>)`
  (74 are message-only, applied to `(false)`). The IIFE keeps the message expression lazily
  evaluated. One composite: `if (macroCondition(!FLAG)) <assert-&&-statement>` at
  `packages/-ember-data/dist/store.js:39`.
- **The runtime-toggle logging shape** (91 positive + 2 negated occurrences):
  ```js
  if (macroCondition(getGlobalConfig().WarpDrive.activeLogging.LOG_X)) {
    if (getGlobalConfig().WarpDrive.debug.LOG_X || globalThis.getWarpDriveRuntimeConfig().debug.LOG_X) <body>
  }
  ```
  Outer condition is build-strippable (`activeLogging` is all-`true` in DEBUG/TESTING builds,
  `debug[X]||false` in prod — `createLoggingConfig`); the inner left operand is a **bare**
  config read (inlined by embroider in compile-time/prod mode; left as a runtime read of the
  baked config in dev run-time mode — see §1.2); the `globalThis` fallback is plain runtime
  JS.
- **8 `importSync` sites** (string-literal args only), **5 `dependencySatisfies`** (all `"*"`
  ranges), **4 `moduleExists`** — two of them **bare in expression position** inside a thrown
  error message ternary (`ember/dist/index.js:260`). These are load-bearing for
  `@ember/test-waiters`, `ember-provide-consume-context`, `ember-inflector`, `@ember/object`.
- **`@ember/debug` residue**: 36 dist files import `deprecate` (25), `warn` (6), both (3), or
  handler registration (2, private test infra). **No `assert` import from `@ember/debug`
  anywhere.** This is what `babel-plugin-debug-macros` processes app-side today — and the
  documented reason ember app configs deliberately *omit* debug-macros is that ember-source
  provides the real module and `registerDeprecationHandler`-based test helpers must keep
  intercepting.
- **Zero template-position macros, zero `.gts`/`.gjs`/`.hbs` files in any dist** — templates
  ship precompiled inside plain `.js`. `getOwnConfig` appears only in private, never-published
  packages. `isTesting`/`isDevelopingApp`/`getConfig`/`each`/`failBuild`: zero occurrences.
- **The flag modules ship real (but incoherent) runtime values**: `build-config/dist/env.js`
  exports all six env flags as `true` — `DEBUG` and `PRODUCTION` simultaneously (§7 fixes
  this); `deprecations.js` all `true`; `debugging.js` all `false`; `macros.js` a real throwing
  `assert`.

Because WarpDrive's own publish pipeline is the only author of these shapes, the plugin
implements an evaluator for this specific dialect — not a re-implementation of
`@embroider/macros`.

### 1.2 What `@embroider/macros` actually does today (and which parts we must replicate)

From `@embroider/macros@1.20.6` sources:

- **The highlander never fires under Vite.** `buildMacros()` calls `MacrosConfig.for({}, root)`
  with a **fresh object literal as the WeakMap key** (`src/babel.js:10`), so the process-global
  handshake (`global.__embroider_macros_global__`, a `WeakMap<keyObject, state>`) never matches
  between copies — N copies silently diverge. Coordination only ever worked in classic builds
  where the shared EmberApp instance is the key. Our replacement must be content-addressed
  (`Symbol.for`), not object-identity-addressed.
- **No protocol version.** Compatibility across embroider copies is by additive shape-patching
  of the shared state, silently. `finalize()` flips a **per-instance** `_configWritable` flag —
  another copy sharing the same state can keep writing after one finalized. The constructor
  unconditionally resets the shared `'@embroider/macros'` global key on every construction.
  Each of these is a named failure mode our store design closes (§5).
- **"Static in prod, runtime in dev" is narrower than it sounds.** Even in run-time (dev) mode,
  `macroCondition` predicates are statically evaluated and branches pruned unless the predicate
  has a runtime implementation — and `getGlobalConfig()` chains **do not** (the only exceptions
  are `.fastboot.*` and `isTesting()`, neither of which appears in any WarpDrive dist). So for
  every `macroCondition` site, compile-time-only semantics in our plugin is *exact parity*, dev
  and prod alike. One intentional divergence remains: the 93 **bare** `debug.LOG_X` reads (the
  double-if inner operand) are left as runtime reads of the baked config by embroider's dev
  run-time mode (`buildMacros` enables it iff `NODE_ENV === 'development'`), while our plugin
  inlines the same value as a literal — behaviorally equivalent for all supported usage, since
  the only thing dropped is embroider's undocumented `window._embroider_macros_runtime_config`
  mutation channel, which WarpDrive does not use (its runtime channel is
  `globalThis.getWarpDriveRuntimeConfig`, preserved byte-identically). WarpDrive's actual
  runtime-toggle mechanism survives unchanged.
- **File scoping is `referencesImport('@embroider/macros', ...)`** — the babel plugin visits
  every file babel touches but only acts on bindings imported from `'@embroider/macros'`, and
  removes those imports on Program exit. This is what makes our non-interference proof (§6)
  mechanical: no import, no match.
- **The lockfile-hash cache-buster** (`babel-plugin-cache-busting`, embroider issue #906)
  exists because `dependencySatisfies` results are invisible to file-content caches. We port
  the lesson (§4.7).

### 1.3 The toolbox (verified in-graph)

- **unplugin 3.3.0**: one factory → `.vite/.rollup/.rolldown/.webpack/.rspack/.rsbuild/.esbuild`
  plugins. Object-form hooks take declarative `{ filter: { id, code }, handler }` filters which
  **rolldown/Vite 8 evaluate natively in Rust** (bare-function `.filter` properties are silently
  ignored by the compat bridge — a caveat this repo already documented in
  `tools/internal-config/vite/babel.js`). Webpack/rspack adapters are loader-based; esbuild's
  adapter registers **one `onLoad` per plugin and separate esbuild plugins do not chain
  transforms** (`onLoad` is winner-take-all); esbuild has no `enforce` and no `watchChange`;
  the webpack transform loader discards our sourcemap when the incoming map is null (cosmetic).
  unplugin 3.x does **not** bundle a parser (`context.parse` throws unless set).
- **Vite 8 is rolldown-powered mainline** (`rolldown ~1.2.x` is a real dependency; the
  workspace catalog pins `vite ^8.2.2`), and vite/rolldown expose oxc (`rolldown/utils`
  exports `parseSync`/`transformSync`) — but only when vite/rolldown is the host.
- **`oxc-parser@0.130.0`** is already version-proven in this exact dependency graph (via
  `ember-estree`, which pairs it with `content-tag ^4.2.0` on decorator-heavy Ember code).
  It parses JS/JSX/TS/TSX/decorators, returns ESTree-shaped ASTs, and every `parseSync` gives
  `module.staticImports` — an es-module-lexer-grade import summary for free.
- **`content-tag@4.2.0`** (in-graph transitively) exposes `parse()` returning template ranges
  without transforming — sufficient to blank `<template>` bodies before oxc parsing.
- **Angular** (model knowledge, flagged as such): the first-party esbuild builder exposes no
  public plugin hook; `@angular-builders/custom-esbuild` (community) loads esbuild plugins;
  the legacy webpack builder via `@angular-builders/custom-webpack` runs unplugin's webpack
  output unmodified. **Next.js**: webpack builds accept unplugin webpack plugins;
  **Turbopack runs no JS webpack plugins or unplugin** — its only bridge is `turbopack.rules`
  invoking webpack-*loader*-shaped transforms (id+code in, code out; no `resolveId`, no virtual
  modules, JSON-only options).

---

## 2. Package layout and user-facing API

### 2.1 `@warp-drive/build`

```jsonc
// package.json (abridged)
{
  "name": "@warp-drive/build",
  "type": "module",
  "exports": {
    ".":            { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./vite":       { "default": "./dist/vite.js" },
    "./rollup":     { "default": "./dist/rollup.js" },
    "./rolldown":   { "default": "./dist/rolldown.js" },
    "./webpack":    { "default": "./dist/webpack.js" },
    "./rspack":     { "default": "./dist/rspack.js" },
    "./rsbuild":    { "default": "./dist/rsbuild.js" },
    "./esbuild":    { "default": "./dist/esbuild.js" },
    // transform-only webpack-loader shape: Turbopack + "bring your own wiring" bridge
    "./loader":     { "default": "./dist/loader.cjs" },
    // 6.0 classic-ember bridge + babel-only holdouts (§8.3)
    "./babel-plugin": { "default": "./dist/babel-plugin.cjs" },
    // internal: the config store, shared with @warp-drive/build-config's patched setConfig
    "./store":      { "default": "./dist/store.js" }
  },
  "dependencies": {
    "unplugin": "^3.3.0",
    "oxc-parser": "^0.130.0",
    "magic-string": "^0.30.21",
    "semver": "^7.8.5",
    "@warp-drive/build-config": "workspace:*"   // -primitives reuse, §2.2
  },
  "peerDependencies": { "content-tag": "^4.2.0" },
  "peerDependenciesMeta": { "content-tag": { "optional": true } }
}
```

- Per-bundler entries are 3-line re-exports of one `createUnplugin` instance (the
  `unplugin-vue` precedent).
- **No virtual modules, no `resolveId`, no emitted import specifiers.** Everything the
  transform emits is inlined: boolean literals, the 2-line `esCompat` helper, and the
  ember-debug shim preamble (§4.3). This is a deliberate constraint: it makes `./loader` a
  pure `code in → code out` webpack loader — the only shape Turbopack's `turbopack.rules` can
  host — sidesteps webpack/rspack virtual-module machinery entirely, and leaves no emitted
  specifier whose resolution could fail on any host (the sole exception is `importSync`
  hoisting, which re-emits specifiers that already existed in the source).
- Hooks used: `transform` (object form with filters — native Rust evaluation on Vite 8),
  `buildStart` (store finalize + prod-without-config check), `buildEnd` (coverage assertion,
  §4.8), and a `vite.config` sub-hook (the `optimizeDeps.exclude` push — concrete enumerated
  names, per §0 requirement 1).

### 2.2 Options

```ts
import type { WarpDriveConfig } from '@warp-drive/build-config'; // identical surface, re-exported

export interface WarpDriveBuildOptions extends WarpDriveConfig {
  // WarpDriveConfig: debug, polyfillUUID, includeDataAdapterInProduction,
  //                  compatWith, deprecations, features, forceMode — unchanged.

  /** App root used as the config-store key. Default: bundler root (vite configResolved.root,
   *  webpack compiler.context), else process.cwd(). realpath-normalized. */
  root?: string;

  /** Packages whose files the plugin owns (may rewrite @embroider/macros / @ember/debug /
   *  flag-module imports inside them). Matched against the OWNING package.json's `name`
   *  (upward walk from the file, directory-memoized), never against the file path.
   *  Default: ['@warp-drive/*', '@ember-data/*', 'ember-data', 'warp-drive'].
   *  Extend for mirror builds: ['@warp-drive-mirror/*']. */
  packages?: string[];

  /** @ember/debug deprecate/warn handling in owned dists:
   *  'runtime' — leave untouched (ember apps: ember-source provides the module; preserves
   *              registerDeprecationHandler dispatch and expectDeprecation test counts)
   *  'shim'    — delete the import and inline a compact console.warn-backed shim preamble
   *              (§4.3); calls stripped in prod
   *  'strip'   — delete the calls in all modes
   *  Default 'auto': 'runtime' if ember-source resolves from root, else 'shim'. */
  emberDebug?: 'runtime' | 'shim' | 'strip';

  /** Adopt config registered elsewhere instead of finalizing plugin options at buildStart.
   *  Requires a source the plugin can order before its own transforms: either config already
   *  registered when the bundler config loaded (classic ember-cli-build setConfig), or a
   *  `configFile` the plugin imports itself at buildStart. See §5.4. */
  deferConfig?: boolean;

  /** Path to a module the plugin imports at buildStart when deferConfig is set; it must call
   *  setConfig (or default-export a WarpDriveConfig). Exists because lazily-loaded babel
   *  configs load AFTER our enforce:'pre' transforms run — see §5.4. */
  configFile?: string;

  /** getOwnConfig() parity for the two private test-infra consumers. */
  packageConfigs?: Record<string, object>;

  /** Suppress the hard error for a production build that reached @warp-drive code with no
   *  registered config. */
  allowUnoptimizedProduction?: boolean;

  /** Content-addressed transform cache (in-memory always; disk under
   *  node_modules/.cache/warp-drive-build when true). Default true. */
  cache?: boolean;
}

export declare const warpDrive: UnpluginInstance<WarpDriveBuildOptions | undefined>;
```

**Config semantics are reused, not reimplemented.** `@warp-drive/build-config` gains a
dependency-free internal entry `-primitives` exporting today's actual `getEnv`,
`getDeprecations`, `getFeatures`, `createLoggingConfig`, and the `InternalWarpDriveConfig`
shape (none of which import embroider); `@warp-drive/build` imports them. One implementation in
the repo → the option surface and env-var contract (`EMBER_ENV`, `IS_TESTING`,
`EMBER_CLI_TEST_COMMAND`, `NODE_ENV`, `CI`, `IS_RECORDING`, `WARP_DRIVE_FEATURE_OVERRIDE`,
`forceMode` including its undocumented `'debug'` alias, the `compatWith` semver resolution, the
`includeDataAdapter` formula) cannot drift. **No migration mapping is needed: the option
surface is identical to `setConfig`'s today.**

### 2.3 Per-framework wiring (real snippets)

**Vite + React** (also SolidStart, Astro, Qwik, Nuxt via `addVitePlugin`):

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import warpDrive from '@warp-drive/build/vite';

export default defineConfig({
  plugins: [react(), warpDrive({ compatWith: '5.7' })],
});
// babel.config.mjs: DELETED. The `esbuild: false` hack: DELETED — vite's native oxc
// transformer handles TS/JSX; WarpDrive's macros were the only reason babel existed here.
```

**Vite + Svelte / SvelteKit:**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import warpDrive from '@warp-drive/build/vite';
export default { plugins: [sveltekit(), warpDrive({ compatWith: '5.7' })] };
```

**Next.js (webpack):**

```js
// next.config.mjs
import warpDrive from '@warp-drive/build/webpack';
export default {
  webpack(config) {
    config.plugins.push(warpDrive({ compatWith: '5.7' }));
    return config;
  },
};
```

**Next.js (Turbopack)** — no unplugin support exists in Turbopack; the loader bridge:

```js
// next.config.mjs
export default {
  turbopack: {
    rules: {
      '**/node_modules/{@warp-drive,@ember-data,ember-data}/**/*.js': {
        loaders: [{ loader: '@warp-drive/build/loader', options: { compatWith: '5.7' } }],
      },
      './src/**/*.{ts,tsx}': {
        loaders: [{ loader: '@warp-drive/build/loader', options: { compatWith: '5.7' } }],
      },
    },
  },
};
```

The loader applies the same internal marker filter, so blanket globs are safe; options must be
JSON. The general rule: **the globs must cover every name in the `packages` option** — note the
unscoped `ember-data` entry above (its dist carries macros too). Known limitation: the globs
assume a `/node_modules/<name>/` path segment — true for npm and pnpm (which preserves the
segment under `.pnpm`), not for Yarn PnP or exotic layouts, which fall through to zero-plugin
behavior; the runtime unconfigured-warning (§7.3) is the detection story, and the docs must say
so.

**Angular (esbuild builder)** via `@angular-builders/custom-esbuild`:

```jsonc
// angular.json → architect.build
{ "builder": "@angular-builders/custom-esbuild:application",
  "options": { "plugins": ["./warp-drive.esbuild.mjs"] /* ... */ } }
```
```js
// warp-drive.esbuild.mjs
import warpDrive from '@warp-drive/build/esbuild';
export default warpDrive({ compatWith: '5.7' });
```

The esbuild adapter sets `esbuild.onLoadFilter` to a regex matching only owned node_modules
paths, so it never claims `onLoad` for app `.ts` files and cannot collide with Angular's
compiler plugin (esbuild `onLoad` is exclusive). Documented consequence: app-code flag imports
(`import { DEBUG } from '@warp-drive/core/build-config/env'`) are not compiled under the Angular
esbuild builder — they fall back to the real flag modules, which (after the 5.x seed fix, §7.1)
carry **correct** runtime values: degraded means unoptimized, not wrong. Angular's legacy
webpack builder via `@angular-builders/custom-webpack` gets full support.

*(The onLoadFilter path regex here is a fast-path prefilter, not the correctness gate — the
package.json-name ownership walk in the handler remains authoritative. Under esbuild the
symlinked-workspace consequence is reduced coverage of the regex, which the §4.8 coverage
assertion surfaces, never wrong rewrites.)*

**Ember (embroider-vite):**

```js
// vite.config.mjs
import { ember, extensions } from '@embroider/vite';
import warpDrive from '@warp-drive/build/vite';
export default {
  plugins: [
    ...ember(),                        // templateTag() runs here, enforce:'pre'
    warpDrive({ compatWith: '5.7' }),  // also enforce:'pre', AFTER ember() in array order
  ],
};
// babel.config.mjs shrinks to decorators + template-compilation. No buildMacros, no setConfig,
// no macros(), no Macros.babelMacros — unless other addons need embroider macros, in which
// case both coexist safely (§6). emberDebug auto-detects 'runtime': deprecate/warn stay
// pointed at real @ember/debug so expectDeprecation counts keep working.
```

**Ember classic (broccoli/ember-cli): unchanged in 5.x.** `setConfig(app, __dirname, cfg)` in
`ember-cli-build.js` keeps working exactly as today (the embroider-macros v1 addon inlines at
app build). The 5.x patch makes `setConfig` *additionally* publish to the neutral store (§5.4),
inert in classic but giving mixed setups one source of truth. The 6.0 classic story is §8.3.

**rspack/rsbuild:**

```js
import warpDrive from '@warp-drive/build/rspack';
export default { plugins: [warpDrive({ compatWith: '5.7' })] };
```

---

## 3. Parser and rewrite strategy

**Parser: `oxc-parser` (^0.130.0). Edits: `magic-string`. No codegen printer. No babel.**

- Must parse TS/TSX/decorators: dist files are plain JS, but app code importing flag modules is
  `.ts`/`.tsx` with decorators (the react/vue/svelte test apps prove it), and we run
  pre-type-stripping. `acorn` is disqualified (no TS). `@babel/parser` would work (the
  schema-dsl vite plugin uses it parser-only) but keeps a babel-family package on the app path
  and is an order of magnitude slower.
- Version-proven in this exact graph (`ember-estree`), napi bindings for all supported
  platforms with wasm fallback. `parseSync().module.staticImports` doubles as the second-stage
  filter without a second tool.
- Why not `rolldown/utils` (vite's bundled oxc)? It exists only when vite/rolldown is the host;
  webpack/rspack/esbuild/Turbopack would have nothing. One parser across all six hosts beats
  two code paths. (A `try { import('rolldown/utils') }` fast path is a deferred option.)
- Why magic-string instead of printing: every rewrite in the grammar is a *range* operation —
  replace a call with a literal, splice a branch, delete a statement, prepend a line. Untouched
  code stays byte-identical (minimal diff risk against 15 packages of dist), and
  `generateMap({ hires: 'boundary' })` gives correct sourcemaps for free. A printer's risks
  (formatting drift, comment loss, re-escaping across ~1700 sites) are eliminated wholesale.

**Two engines, chosen per-import (not per-file, not per-version):**

1. **Legacy engine** (§4.3): a constant-folding evaluator + structural pruner for the published
   embroider-shape grammar. AST-walking is genuinely required here because dead branches
   contain `importSync("@ember/object")` etc. that must never be resolved in non-ember apps —
   `if (false)` residue is not an option, dev builds have no minifier.
2. **Carrier engine** (§4.4): for flag-module imports (app code today, Carrier v2 dists at
   6.0), the **import→const preamble trick**: delete the flag `ImportDeclaration`, prepend
   `const FLAG = <literal>;`. ESM import bindings are unique in module top-level scope, so no
   collision and no reference/scope analysis is possible or needed; inner shadows keep meaning
   their own bindings. Prod branch deletion is then per-module-scope constant folding, which
   every mainstream minifier performs (and which webpack's cross-module const-propagation
   weaknesses cannot affect). The entire "11 placements" grammar problem does not exist for
   this engine — a `const` is legal wherever an expression is. (The 6.0 conditional-dependency
   macros `peerSatisfies`/`hasModule`/`loadSync` are the exception: they need branch pruning
   and stay on the legacy engine, re-keyed — §7.2.)

A mixed graph — a 5.x dist (legacy shapes), a 6.0 dist (Carrier v2), and app source — compiles
in one build with one config; each import statement selects its engine.

---

## 4. The transform pipeline

### 4.1 Per-file gating (cheapest first)

**Gate 1 — declarative unplugin filter** (Rust-native on Vite 8/rolldown; JS elsewhere):

```ts
transform: {
  filter: {
    id: {
      include: /\.(m|c)?[jt]sx?([?#]|$)|\.g[jt]s([?#]|$)/,   // explicit extension allowlist
      exclude: [/\0/],
    },
    code: { include: [                    // include array = OR; literal substring match
      '@embroider/macros',                // legacy carrier (published 5.x dists)
      '/build-config/',                   // flag-module imports, both prefixes, cheaply
      '@ember/debug',                     // deprecate/warn residue
    ]},
  },
  handler(code, id) { /* gates 2-3 */ },
}
```

This subsumes the repo's proven `babelRequiredImports` marker strategy (`maybeBabel`), pushed
into the bundler's native filter. Files without a marker never invoke JS. The explicit
extension **include** (not just an exclude list) keeps `.vue`/`.svelte` SFCs and unknown
extensions away from the parser; their `<script>` blocks arrive later as virtual `.ts`/`.js`
modules where the id filter admits them.

**Gate 2 — ownership**: resolve the file's owning package by walking up to the nearest
`package.json` and reading `name` (directory→result cache; one fs walk per directory ever).

| File owner | `@embroider/macros` | flag-module imports | `@ember/debug` |
|---|---|---|---|
| matches `packages` allowlist | rewrite (legacy engine) | rewrite (carrier engine) | per `emberDebug` |
| anything else (app code, other addons) | **never touch** | rewrite only the exact warp-drive specifiers | never touch |

**Gate 3 — parse**: `parseSync(id, code, { lang: byExtension })`; confirm via
`module.staticImports` that a relevant specifier really is imported (not a comment/string hit);
otherwise return null untouched.

### 4.2 Idempotency and re-entry

The output of either engine contains none of Gate 1's marker strings for the work it did. A
second plugin instance (double-wiring, nested esbuild hosts, a stray loader) is a guaranteed
no-op. This is a **load-bearing property**, relied on by the highlander (§5) and coexistence
(§6) stories.

### 4.3 Legacy engine — exhaustive against the inventory

Order per file: (1) evaluate macro leaf expressions to literals, (2) resolve `macroCondition`
placements bottom-up (innermost first — the nested ternary resolves inner before outer),
(3) compute kept source ranges, (4) apply `importSync`/`@ember/debug` rewrites only within kept
ranges, (5) delete now-unused `@embroider/macros` import specifiers.

**Leaf evaluation:**

| Shape | Result |
|---|---|
| `getGlobalConfig().WarpDrive.<group>.<flag>` (zero-arg only) | literal from finalized config (`env`/`activeLogging`/`debug`/`deprecations`/`features`) |
| bare `.polyfillUUID` / `.includeDataAdapter` / `.compatWith` | literal (string or `null` for compatWith) |
| `!<chain>` (single negation — the only depth found) | negated literal |
| `dependencySatisfies("pkg", "range")` | owner's package.json must declare `pkg` in **`dependencies` or `peerDependencies` only** — embroider counts `devDependencies` only when the owner is the app itself, which never applies to owned dist files — AND resolved version satisfies (`includePrerelease: true`); MODULE_NOT_FOUND → false. This distinction is load-bearing: `@warp-drive/core` declares `ember-source` only in devDependencies, so the `dependencySatisfies("ember-source", "*")` probe at `src-C0Cibcpn.js:3852` is false-by-rule even when ember-source is hoisted-resolvable — a deps+devDeps rule would silently diverge from embroider at exactly this site. Cached per `(ownerRoot, pkg, range)`, keyed alongside the lockfile hash (§4.7); a parity golden test against embroider's output for the ember-source probe is required |
| `moduleExists("m")` — guarded or **bare** | resolution attempt from the owner → boolean literal in place (bare form: surrounding ternary left for the minifier) |
| `getOwnConfig()` / `.X` | literal from `packageConfigs[ownerName]`; `undefined` if unset |

**`macroCondition` placement resolution** — splice strategy chosen to minimize hand-rolled
precedence logic (this was the judged weak point of a pure-splice design):

- **Statement-level shapes** (`if`/`else if`/bare-`else` body/logical-AND statement) resolve by
  **removal-based collapse, never by re-emitting a source slice**: true → delete the
  `if (<cond>)` header tokens (and the `else` keyword linkage where applicable) and the dead
  alternate as *disjoint ranges*, leaving the kept-branch chunk **in place** — block braces
  kept (`let`/`const` scoping preserved), and, critically, any edits already applied *inside*
  the kept branch survive, because kept text is never reconstructed from the original source.
  This matters on real dist: statement-level macros nest inside other macros' kept branches
  (`store.js:39` and its `else` arm, `json-api/dist/index.js:904-913`,
  `store/dist/index.js:163` — §1.1), and bottom-up resolution edits the inner sites first; an
  overwrite-with-original-slice rule would resurrect already-deleted `macroCondition` text
  after its import was removed. False → delete the statement or splice the dead arm (walking
  `else if` chains, preserving linkage). A kept branch whose contents were themselves entirely
  deleted leaves `{}` — valid in both `if` and `else` positions.
- **Expression positions** (return-ternary, initializer, argument, `??`-RHS, nested ternary):
  **replace only the `macroCondition(...)` call with `true`/`false`** and leave the surrounding
  ternary intact for the minifier — a literal is legal in every expression position, so no
  parenthesization heuristics exist to get wrong. Exception: if the *discarded* ternary branch
  contains `importSync`/`moduleExists`, splice the ternary down to the kept branch instead
  (kept-range tracking makes this the already-required path); the one nested-ternary site is
  exactly this case and resolves innermost-first.
- Dead branches are **pruned, not `if (false)`-wrapped** — mandatory for `importSync`
  correctness (above) and dev-bundle hygiene.

**Runtime double-if logging** — no special rule; it is composition:
outer `macroCondition(activeLogging.X)` per the statement rule, inner bare `debug.X` chain
inlined as a literal, `globalThis.getWarpDriveRuntimeConfig()` left byte-identical:

```js
// dev, flag unconfigured — outer header tokens deleted, block braces kept (§ above);
// behavioral parity with today's output (byte-parity with today's compile-time/prod-mode
// output — embroider's dev run-time mode leaves the inner read as a runtime lookup of the
// same baked value, §1.2):
{ if (false || globalThis.getWarpDriveRuntimeConfig().debug.LOG_CACHE_POLICY) console.log(`...`); }
// prod, unconfigured: statement deleted (zero bytes).
// prod, configured true: if (true || globalThis...) — short-circuit guarantees the global
// (never installed outside TESTING builds) is never called. Invariant preserved.
```

The negated json-api variant (`!(A || B)` inner) resolves by the same composition.

**`importSync`** (eager, matching `buildMacros`' forced mode): per surviving call, hoist
`import * as _wd$m0 from "<specifier>";` and replace the call with `_wd$esc(_wd$m0)`, with the
2-line getter-safe `esCompat`-equivalent helper prepended once per file (inlined — no virtual
module, per the Turbopack constraint). Destructured and `.default` consumer patterns compose
unchanged. Dynamic specifiers: not present in any dist → not implemented; a clear build error
guards the case.

**`@ember/debug`** (replacing `babel-plugin-debug-macros`):

- `'runtime'` (ember): leave everything — same deliberate choice today's ember configs make.
- `'shim'` (non-ember, dev/test): delete the `@ember/debug` import and **prepend a compact
  inline shim preamble** (like the `esCompat` helper — ~15 lines defining `deprecate`/`warn`,
  console-backed, with the once-per-id dedup set and handler registry living on a
  `Symbol.for('warp-drive.debug-shim')`-keyed `globalThis` slot so all 36 shimmed files share
  one state). Inlining — rather than rewriting the specifier to a module in the plugin package
  — is deliberate: no emitted import specifier means no resolution question at all, which
  sidesteps pnpm strict resolution (core doesn't declare `@warp-drive/build`), Vite's
  `server.fs.allow` for out-of-workspace plugin files in symlinked monorepos, Windows
  drive-letter specifiers in emitted ESM, and Turbopack's unverified handling of absolute
  specifiers — and keeps the no-`resolveId` constraint intact. `registerDeprecationHandler`/
  `registerWarnHandler` (private test-infra only) register into the same slot.
- `'shim'`/`'strip'` (prod): delete each `deprecate(...)`/`warn(...)` call statement (all dist
  occurrences are statement-position) and drop the import — matching debug-macros'
  `isDebug: false` output. No preamble is emitted.
- The deep import `@ember/debug/data-adapter` (a class, not a debug tool) is never touched.

**Unknown-shape tripwire**: an owned file whose macro usage doesn't match the grammar (a future
WarpDrive publishing new shapes) → hard error in prod, warn-and-skip in dev, naming both
versions. Additively from release "A" onward, dist-emitting packages declare
`"warpDrive": { "distGrammar": 1 }` in package.json so the error can say precisely "upgrade
`@warp-drive/build` to ≥ X".

### 4.4 Carrier engine — flag-module imports (app code now; Carrier v2 dists at 6.0)

Sources: the ten flag-module specifiers
(`{@warp-drive/build-config,@warp-drive/core/build-config}/{env,macros,debugging,deprecations,canary-features}`),
plus at 6.0 the `-activation`, `-flags`, and `-seed` internal modules (§7).

| Source shape | dev/test output | prod output |
|---|---|---|
| env/deprecation/feature flag import | import deleted; `/*! wd:cfg */ const FLAG = <literal>;` prepended (namespace imports get an object literal) | same (literals differ); minifier folds branches |
| `assert(msg, cond)` from `macros` (statement position enforced — a new, stricter contract; today's transform only enforces call-expression usage via `'Expected a call expression'`) | `((test) => { if (!test) throw new Error(<msg-expr>) })(<cond ?? false>)` — message lazily evaluated | statement deleted; import dropped |
| `if (LOG_X)` from `debugging` (**if-statement position required**, same error text as `babel-plugin-transform-logging`) | `if (<debug.X literal> \|\| globalThis.getWarpDriveRuntimeConfig().debug.LOG_X) {A}` | true → branch kept unconditionally; false → deleted |
| `export { FLAG }` re-export | untouched (defers to the final consumer — same rule as today's transforms; covers core's `dist/build-config/*` re-export shims) | same |
| `import type` / type-only specifiers | untouched | same |
| unknown name from a flag module | build error `Unexpected flag ${name} imported from ${path}` (same contract as today) | same |

The `-seed` module (§7.1) is the one file whose *content* is replaced wholesale: the resolved
config JSON with an applied-sentinel banner.

TDZ note (accepted residual): replacing a live import binding with a prepended `const` differs
only if a circular-import back-edge calls into the module before its first statement runs. Flag
modules are leaves and rolldown-emitted dist evaluates imports/consts first; not producible in
any test-app graph. A reproduction would be handled by leaving the import and rewriting the
flag module per-importer (designed, shelved).

### 4.5 `.gts`/`.gjs` and `.tsx`

- Dist: verified zero `.gts/.gjs/.hbs` and zero template-position macros — the dist path never
  needs template handling.
- App `.gts/.gjs`: under embroider-vite, `templateTag()` (content-tag) is `enforce: 'pre'` and
  ordered before us → we receive plain JS/TS. If raw `<template>` syntax ever reaches us
  (non-embroider exotica), lazily import the optional `content-tag` peer, use `parse()` to
  blank template ranges (offsets preserved) in a scratch copy for oxc, and apply edits to the
  original — template bodies can never intersect our edits. Missing peer → clear error.
- `.tsx`/`.ts`/decorators: oxc parses natively; we only splice spans, so TS/JSX/decorators pass
  through for the framework's own compiler. `enforce: 'pre'` everywhere it exists (vite;
  webpack/rspack loader stage); raw rollup has no enforce concept — there, the documented
  recipe places `warpDrive()` before any babel/swc plugin in the array, with the either-order
  convergence of §6 as the backstop. esbuild has no enforce — irrelevant, we scope to
  node_modules there.

### 4.6 Sourcemaps

One `MagicString` per file; `{ code, map: ms.generateMap({ hires: 'boundary' }) }`. Rollup-likes
merge natively; the esbuild adapter emits inline maps and remaps chains; the webpack loader
passes `res.map` (known quirk: a null incoming map discards ours — cosmetic; dist ships its own
maps, and carrier-engine edits are line-preserving except the one-line preamble).

### 4.7 Caching and dev-server behavior

- The transform is pure per `(code, configHash, depsHash)`. `configHash` =
  sha256(canonical-JSON of the normalized config); `depsHash` = lockfile identity (mtime+size,
  full hash lazily) — porting embroider's cache-busting lesson so `dependencySatisfies` results
  invalidate correctly. Webpack/rspack persistent-cache invalidation cannot ride loader
  options: unplugin's injected transform loader passes the **live plugin object** as its
  options (verified in unplugin 3.3.0's webpack adapter), which is neither serializable nor
  hash-bearing. Instead, the plugin's `webpack:`/`rspack:` escape hatch contributes
  `configHash + depsHash + pluginVersion` to the compiler's cache version
  (`compiler.options.cache.version` suffix, plus the lockfile as a `buildDependency`), so a
  config change between builds invalidates the filesystem cache.
- Content-addressed result cache: `hash(code) + configHash + depsHash + pluginVersion + mode`.
  node_modules dist is immutable per install → warm dev-server starts skip WarpDrive's largest
  chunks. In-memory always; optional disk cache.
- Config is read once per build; **changing build config requires a dev-server restart, same as
  today's babel path** — documented, not worked around. No plugin-triggered graph invalidation
  exists; runtime log toggles need zero rebuilds by construction (§9).

### 4.8 Coverage assertion

At `buildEnd`: if `@warp-drive/core` was resolvable from the app root and the store finalized,
but **zero owned files were transformed**, emit a loud warning naming the likely causes
(esbuild `onLoad` shadowing by another plugin, Turbopack glob gaps, a pre-loader consuming
markers). This is the only workable detector for the esbuild adapter's silent failure mode.

---

## 5. The highlander mechanism

### 5.1 Threat model

One build process may contain: N copies of `@warp-drive/build` (pnpm peer-dedup failures,
nested tooling), P copies of the patched `@warp-drive/build-config` (babel path), K plugin
*instances* (vite client+SSR environments, a stray loader), M copies of `@warp-drive/*` runtime
libraries — plus a real embroider `MacrosConfig` alive for other packages. All transformers
must apply **one** config. Additionally: worker processes (webpack `thread-loader`, vite worker
threads) do not share `globalThis`.

Structural simplification worth stating: **library copies hold no build-time state.** They are
inert text; the store only has to reconcile *writers* (plugin instances and `setConfig` call
sites). The runtime side has its own shipped highlander (`getOrSetUniversal` /
`__warpDrive_universalCache`, the TESTING-gated dup-copy tolerance), untouched by this design.

### 5.2 The store

```ts
// @warp-drive/build/store — also imported (or byte-identical vendored) by
// @warp-drive/build-config's patched setConfig. Symbol.for makes every physical copy converge.
const KEY = Symbol.for('warp-drive.build-store');

interface StoreV1 {
  protocol: 1;                 // structural version of THIS object
  copies: Array<{ pkg: string; version: string; path: string }>;
  configs: Map<string /* realpath(appRoot) */, ConfigEntry>;
}
interface ConfigEntry {
  protocol: 1;
  raw: WarpDriveConfig;               // JSON-plain user input      ┐ frozen-forever
  rawHash: string;                    // stable-stringify sha256    │ core fields:
  sealed: boolean;                    //                            │ every future protocol
  finalized: InternalWarpDriveConfig | null; // exact today's shape ┘ must keep these readable
  envSnapshot: Record<string, string | undefined>;  // the 7 env vars at finalize time
  sources: Array<{ from: string; via: 'plugin' | 'setConfig' | 'legacy-app-options' }>;
  finalizedBy?: string;               // "vite@8.2.2 via @warp-drive/build@1.0.0 (/abs/path)"
  // unknown extra fields MUST be preserved verbatim by all writers
}
```

Design rules, each closing a named embroider failure mode (§1.2):

- **`Symbol.for` string key**, not a WeakMap keyed by an object nobody shares — embroider's
  handshake never fires under `buildMacros` because the key is a fresh `{}`; ours converges
  unconditionally across all copies in a process.
- **Explicit `protocol` number** (embroider has none). Additive changes keep `protocol: 1` and
  preserve unknown fields; a breaking change bumps the number AND the new code bridges the old
  shape for one major. Four core fields (`raw`, `rawHash`, `sealed`, `finalized`) are frozen
  for all time so any future protocol can at least read-and-refuse coherently. A copy meeting a
  higher protocol than it speaks fails loudly, naming both copies, versions, and paths.
- **No constructor side-effect writes** (embroider resets a shared key on every construction).
  Store access is get-or-create only; all mutation goes through `register()`.
- **Finalize is per-entry, not per-instance** (embroider's `_configWritable` is per-instance, so
  a second copy can keep writing after another finalized).

### 5.3 Register / conflict / finalize semantics

- `register(appRoot, raw, source)`: no entry → create. Equal `rawHash` → append source —
  **identical configs registered many times are the designed-for normal case**; that is how N
  copies converge. Different hash before finalize → immediate error carrying both provenances
  and the first differing keys:

  > `[WarpDrive::build] Conflicting WarpDrive build configs for app '/srv/app'. First set from ember-cli-build.js via setConfig() with compatWith: '4.12'; then from vite.config.mjs via @warp-drive/build with compatWith: '5.6'. WarpDrive config must be identical everywhere it is declared. Differing keys: compatWith, deprecations.DEPRECATE_TRACKING_PACKAGE.`

  Never first-write-wins, never last-write-wins (embroider's `setGlobalConfig` is silent
  last-write-wins).
- **Finalize at consumption** (plugin `buildStart`, or the babel bridge's first file): runs the
  `-primitives` normalization, snapshots the env vars, freezes the entry. After finalize an
  equal-hash write is a no-op; an unequal write throws a late-write error naming `finalizedBy`.
  Two finalizers whose env snapshots differ (someone mutated `process.env` mid-build) → error
  naming the differing variables.
- **appRoot normalization**: keys are realpaths; lookup falls back exact → nearest ancestor →
  single-entry-with-note, absorbing cwd-vs-configRoot skew between a plugin (`config.root`) and
  a 2-arg `setConfig` (which registers under `process.cwd()`).
- **Multiple appRoots** (monorepo dev servers building two apps in one process) are independent
  entries; each plugin instance binds to its root. The auto `optimizeDeps.exclude` prevents the
  shared-prebundle-cache poisoning case.
- **Worker processes**: no shared globalThis, by design not relied upon — determinism is the
  cross-process mechanism (identical serializable options + identical env → identical
  normalized config), and the store is a per-process conflict detector, not the carrier of
  truth. Two channels exist, honestly distinguished:
  - **unplugin's injected webpack/rspack transform loader** receives the *live plugin object*
    as its options (verified in unplugin 3.3.0), which cannot cross a worker boundary —
    running that loader under `thread-loader`-style worker parallelism is therefore
    **unsupported and documented as such**; cache correctness in that host comes from the
    cache-version contribution (§4.7), not from options.
  - **the `./loader` export** (Turbopack + bring-your-own-wiring) takes JSON options carrying
    `{ raw, configHash }`; it re-normalizes from options + its own `process.env` and **throws
    if its hash disagrees** — env drift between orchestrator and worker becomes a diagnosable
    error instead of silently divergent output.

### 5.4 Config sources and `deferConfig`

**The norm: config lives in plugin options.** `warpDrive({ compatWith: '5.7' })` registers at
factory time and finalizes at `buildStart`. Zero options is valid: full resolution from env
vars alone (`NODE_ENV=production` → correctly stripped prod defaults).

**The bridge: `setConfig` keeps working.** `@warp-drive/build-config`'s patched `setConfig`
(all overloads, including the classic 3-arg form and `ember-data`'s `app.options.emberData`
auto-path) does two writes:

1. `register(appRoot, userConfig, { via: 'setConfig' })` into the neutral store (imported from
   `@warp-drive/build/store` when resolvable, else a byte-identical vendored copy — same
   `Symbol.for` key, interoperable by construction);
2. **unchanged**: `macros.setGlobalConfig(..., 'WarpDrive', normalized)` into embroider — for as
   long as an embroider pass may legally run anywhere. (One-way bridging was explicitly
   rejected: it creates the silent wrong-mode failure where a misordered embroider-first pass
   inlines `undefined` for every WarpDrive chain.)

**The deferred case is explicit — and it never waits on something that loads later.** The
ordering fact that shapes this: the plugin is `enforce: 'pre'`, so its transform of the first
entry file runs **before** babel ever loads a lazily-evaluated `babel.config.mjs` — "wait for
babel's `setConfig`" is not a mechanism, and an entry file importing a flag (`start.ts`
importing `SHOULD_RECORD` is the repo's real pattern) would hit the transform first every
time. Therefore `deferConfig: true` only adopts config from sources that are guaranteed to run
during *bundler-config* loading, and never silently synthesizes:

1. a `setConfig` registration that already exists when finalize is needed (classic
   `ember-cli-build.js` runs before the build; framework presets that register during config
   load), else
2. the `configFile` module, which the plugin imports itself at `buildStart` — before any
   transform — and which calls `setConfig` or default-exports a `WarpDriveConfig`, else
3. a **hard error** at the first config-needing transform, naming the file that needed config
   and the two fixes (pass options to the plugin, or pass `configFile`). Never a silent
   default-seal followed by a confusing late-write error.

An implicit lazy-seal (finalize-with-defaults at first transform) was rejected outright: it is
the same race with a friendlier name.

Convergence table:

| Situation | Outcome |
|---|---|
| both paths wired, identical config | deduped; either pass transforms first; other no-ops (§6) |
| both paths wired, differing config | loud conflict error at build start — never split-brain |
| babel path only | store + embroider populated; today's behavior byte-identical |
| unplugin only | store populated; best-effort `setGlobalConfig` bridge into embroider iff `@embroider/macros` is resolvable and an app-level MacrosConfig exists (classic-addon edge); silence otherwise is the expected end state |
| 2 plugin copies, same options | same store via `Symbol.for`; equal hash; idempotent double-transform (§4.2) |
| plugin newer than library | legacy engine is shape-keyed, not version-keyed; unknown shapes hit the distGrammar tripwire |
| library newer than plugin | unrecognized `/build-config/-` specifiers from an owned path → "carrier v(N) detected; upgrade @warp-drive/build" + seed-derived runtime defaults (correct, unoptimized) |

---

## 6. Non-interference with real `@embroider/macros` (both directions)

**Direction A — we never touch other packages' or the app's embroider usage.** The legacy
engine runs only in files whose *owning package name* is allowlisted. An app file, another
addon, `ember-provide-consume-context`, embroider's own runtime — all fail the ownership gate
and pass through byte-identical. In non-owned files the only bindings we ever rewrite are
imports of the ten warp-drive flag-module specifiers; a co-resident `@embroider/macros` import
and its references are untouched. Ownership scoping (not content sniffing) makes this a proof:
the file sets are disjoint by construction.

**Direction B — the app's embroider babel pass never fights over WarpDrive's files.**

1. *Unplugin first* (the designed ordering: `enforce: 'pre'`, before any babel): our output
   contains zero `@embroider/macros` imports in owned files. Embroider's plugin dispatches
   entirely on `referencesImport('@embroider/macros', ...)` — no import, no binding, provable
   no-op; its Program-exit `removeAllImports` finds nothing. Non-owned files keep their
   embroider imports and are processed by embroider exactly as before.
2. *Embroider first* (misordering, exotic pipelines): embroider compiles WarpDrive's macros
   from **its** `globalConfig.WarpDrive` — which the dual-writing `setConfig` populated with
   the *same normalized object* the store holds. Output is equivalent: identical to ours in
   compile-time (prod) mode; in dev run-time mode embroider leaves the bare `debug.LOG_X`
   reads as runtime reads of the same baked values (§1.2) — behaviorally the same. Our
   **legacy engine** then no-ops — not because "no markers remain" (embroider's dev output
   still contains its own runtime-module deep import, a Gate-1 substring hit) but because
   Gate 3 finds no import whose specifier is exactly `@embroider/macros`; the carrier and
   ember-debug passes still run on their own markers, which is required (a misordered pass
   must not leave `@ember/debug` imports unshimmed in a non-ember app). **Either order
   converges.** Two scoping caveats: (a) this requires the release-"A" build-config patch on
   the babel side — an older installed build-config never feeds the store, so only
   unplugin-first ordering is guaranteed there, and the plugin warns when it detects a
   resolvable-but-unpatched build-config alongside an embroider pass; (b) embroider running
   with no WarpDrive config set at all is today's pre-existing failure mode, not a new one —
   the documented rule stands: keep `setConfig` wherever an embroider pass exists.
3. *Two instances of our plugin*: idempotent (§4.2).

Residual: embroider's classic v1 addon (auto-active because 5.x runtime packages list
`@embroider/macros` as a dependency) installs its babel plugin app-wide in classic broccoli
builds — where the unplugin never runs. No interaction until 6.0 removes the dependency.

We introduce no `__embroider_macros_*` globals and never load `@embroider/macros/src/addon/
runtime`; apps using embroider's browser runtime config for other packages are unaffected.

---

## 7. Publish-pipeline evolution and zero-plugin behavior

### 7.1 5.x: dist unchanged; three additive runtime modules

tsdown + `macros()` keep emitting exactly today's embroider shapes through all of 5.x — every
already-published 5.x release and every one published during the transition is served by the
same legacy engine, and classic ember keeps working untouched.

Additive in release "A" (all shippable in a minor):

- **Coherent runtime defaults in the flag modules.** Today's placeholders are incoherent if
  ever executed (`DEBUG` and `PRODUCTION` both `true`). New fallbacks: `DEBUG=true,
  PRODUCTION=false, TESTING=true, IS_CI=false, IS_RECORDING=false, SHOULD_RECORD=false`.
  `TESTING=true` is the deliberate lenient choice: it keeps runtime log toggles alive and the
  multi-copy runtime highlander tolerant in unoptimized builds (the trade-off — the dup-copy
  throw stays disarmed in never-processed builds — is accepted because every *processed* build,
  i.e. every real production build, gets the strict values; flagged as an open question in §10).
- **The `-seed` module**: `build-config/-seed.js`, shipping `export const seed = null;` with a
  sentinel banner. The env and (later) `-flags`/`-activation` modules derive their runtime
  values from the seed when present. The plugin rewrites this one module's *content* to the
  resolved config JSON. Payoff: any file a bundler withholds from the transform (Angular's
  compiler claiming app `.ts`, a missed Turbopack glob) still gets **correct runtime values** —
  degraded means unoptimized, never wrong.
- **`@warp-drive/core/build-config/runtime-debug`**: first-party `deprecate`/`warn` reporting
  (console-backed, handler registration for test infra) — the target for the 6.0 source
  migration off `@ember/debug`; the plugin's shim covers older dists meanwhile.

### 7.2 6.0: the dist flips to Carrier v2 (the neutral carrier)

The flip is mostly a **deletion**: the env/deprecations/features publish transforms are removed
and the plain flag imports ship verbatim (`import { DEBUG } from
"@warp-drive/build-config/env"; if (DEBUG) { ... }` — any syntactic position, since the carrier
engine makes flags consts). Only two lowerings remain at publish time, kept in the one
controlled environment rather than re-implemented across six bundler hosts:

- **assert** → `DEBUG && ((test) => { if (!test) throw new Error(...) })(pred)` — today's
  shipped shape minus the embroider wrapper; message lazy, condition unevaluated in prod.
- **runtime-activated logging** → the two-key split survives as real modules:

  ```js
  import { LOG_GRAPH_ACTIVE } from "@warp-drive/core/build-config/-activation";
  import { runtimeFlag } from "@warp-drive/core/build-config/-runtime";
  if (LOG_GRAPH_ACTIVE) { if (runtimeFlag("LOG_GRAPH")) { console.log(`...`); } }
  ```

  `-activation` (successor of `activeLogging`) ships all-`true` seed-derived defaults;
  `runtimeFlag` centralizes the runtime gate:

  ```js
  import { seed } from './-seed.js';
  const S = seed ?? { env: { TESTING: true }, debug: {} };
  export function runtimeFlag(name) {
    if (S.debug[name] === true) return true;      // build-time forced-on
    if (!S.env.TESTING) return false;             // prod invariant: never touch the global
    const g = globalThis.getWarpDriveRuntimeConfig;
    return typeof g === 'function' ? g().debug[name] === true : false; // survives mixed pipelines
  }
  ```

  The `typeof` guard is deliberate: a half-processed build (stale babel path, prod) consuming a
  6.0 dist can never call a global that TESTING-stripped code never installed.

Also at 6.0:

- **`@embroider/macros` leaves `dependencies` of every runtime package** (also deactivating the
  classic v1 auto-addon). The 9 conditional-dependency sites migrate to first-party
  replacements in `build-config/macros` — `peerSatisfies`, `hasModule`, `loadSync` — with safe
  runtime fallbacks (`false`/`false`/throw-with-message) forcing the no-dependency branch in
  unprocessed builds. These call shapes are **not** handled by the import→const carrier engine:
  deciding which `loadSync` calls survive (so their imports get hoisted) requires branch
  pruning over the guarding conditions — exactly the retained legacy-engine machinery, re-keyed
  on the new import specifiers. The publish lowering guarantees their placements stay within
  the same closed grammar the legacy engine already speaks, so this is a specifier-table
  change, not new machinery.
- **`@ember/debug` leaves the source** in favor of `runtime-debug`; ember apps get their
  imports re-pointed back to `@ember/debug` by the plugin (`emberDebug: 'runtime'` inverts to a
  rewrite at 6.0), preserving `expectDeprecation` semantics.
- Bare `polyfillUUID`/`includeDataAdapter`/`compatWith` reads become imports from a seed-derived
  `-flags` module (`POLYFILL_UUID`, `INCLUDE_DATA_ADAPTER`, `COMPAT_WITH`).
- Every Carrier v2 dist file carries a `/*! wd-carrier:2 */` banner for O(1) skew detection.
- The `IS_UNPKG_BUILD` standalone build re-implements on the plugin's own transform run at
  publish time.
- **Why never in a minor**: dual-emit is impossible (both carriers are the same expressions),
  and a minor flip silently un-optimizes classic ember (its pipeline speaks only embroider
  shapes) and stale `babelPlugin()` setups — production builds shipping live asserts and all
  deprecated code paths behind a console warning. 6.0 is the honest boundary; the plugin
  (shipping the v2 recognizer in the same release train) already speaks both carriers, so
  mixed 5.x/6.x node_modules trees keep compiling.

### 7.3 Zero-plugin / zero-config behavior

- **Plugin, no options**: full resolution from env vars — the sensible zero-config.
- **Prod build, no config registered at all**: hard error with the `allowUnoptimizedProduction`
  escape hatch.
- **No plugin at all, 6.0 dists**: every module runs with coherent seed-fallback defaults —
  asserts on, deprecated paths on, canary off, log toggles functional. One `console.warn` per
  realm, keyed off `seed === null` — it fires *precisely when* a module wasn't compiled, which
  is the unoptimized case by definition, dev and prod alike.
- **No plugin, 5.x dists**: unchanged from today (the embroider runtime entry throws). Shipped
  bytes cannot be fixed retroactively; honest answer, mitigated by the seed fix for app-code
  imports and by documentation.

---

## 8. Migration and versioning

### 8.1 Release "A" (minor)

`@warp-drive/build@1.0`: legacy engine + `@ember/debug` handling + app-code flag compilation
(subsuming `macros()` for app code) — verified against the current workspace dist, with
**published-tarball verification as an explicit release gate**: fetch representative published
artifacts (4.12, 5.3–5.6 — emitted by older publish pipelines that may predate the current
rolldown-simplified shapes), run the shape inventory over them, and add them to the golden
corpus *before* claiming compatibility with every published release. A
React/Vue/Svelte/plain-Vite app deletes babel entirely on day one. `@warp-drive/build-config`
patch: store dual-write in `setConfig`, `-primitives` entry, seed + coherent defaults +
`runtime-debug`. Golden-file test corpus: transform real dist files (including the §1.1
statement-nesting composites) and assert byte-level expectations; plus the **vite dev-server
test** (§0, requirement 1).

### 8.2 Release "B" (minor)

Docs flip to unplugin-first for every non-classic environment (including the embroider-vite
ember recipe). `babelPlugin()` bugfix: its `js` array spreads `...macros()` — five plugin
entries, since the logging transform is wired twice (debugging sources with `runtimeKey`, env
sources without); Simple-Config users currently cannot compile their own flag imports, a live
bug. One-time
info log on the babel path pointing at the migration guide. Dogfooding: the repo's framework
test apps move from `maybeBabel` to the plugin.

### 8.3 6.0 (major)

Carrier flip per §7.2. Consumer matrix:

- **Unplugin users**: nothing — the plugin already speaks both carriers.
- **Babel-path holdouts**: swap `...macros(), ...Macros.babelMacros, <debug-macros entry>` for
  the single first-party `['@warp-drive/build/babel-plugin', { ...config }]` — a babel plugin
  wrapping the same normalize+store+carrier-rewrite core, no embroider involved.
  `buildMacros`/`setConfig` composition stays legal for apps using embroider for other packages.
- **Ember classic**: `@warp-drive/core`'s `addon-main.cjs` grows what `ember-data`'s
  addon-main already proves possible for `setConfig`: in `included()`, push
  `['@warp-drive/build/babel-plugin', { fromStore: appRoot }]` into
  `app.options.babel.plugins` (deduped by label), so ember-auto-import compiles v2-addon dist
  with the injected plugin and `ember-cli-build.js` `setConfig(...)` remains the entire user
  surface. **This is the single riskiest mechanism in the design** — the precedent proves the
  injection point, not babel-plugin propagation into ember-auto-import's compilation of addon
  code across addon orderings, engines, and ember-cli-babel version skew. De-risking is
  therefore structural: ship behind `WARP_DRIVE_CLASSIC_NEUTRAL=1` for the entire 6.0
  alpha/beta cycle with classic test apps in CI; document the manual `compat-babel`-style
  fallback (user adds the babel plugin line themselves); keep a parallel `dist-embroider/`
  build selected by the addon-shim as break-glass (cost: package size). **Hard GA criterion:
  classic test apps green with the injection across ember-cli-babel majors and at least one
  engines setup — or the flip waits.**
- **Mixed trees** (6.x core + straggler 5.x shim dists, or inverse): the legacy engine is
  shape-keyed, so they compile correctly indefinitely.

**Timeline summary**: `@embroider/macros` is out of the *app-facing path* at release "A" for
unplugin adopters; out of WarpDrive's dependency graph entirely at 6.0. Babel: out of the app
path at "A"; the `./babel-plugin` bridge remains an optional integration indefinitely.
`@warp-drive/build-config`: re-exported from `@warp-drive/build/legacy` in 6.x, retired 7.0.

---

## 9. Dev / test / prod behavior matrix

Env derivation is today's `getEnv`, verbatim (via `-primitives`): `PRODUCTION` from
`EMBER_ENV`/`NODE_ENV`; `DEBUG = !PRODUCTION`; `TESTING ⊇ DEBUG`; `forceMode` override;
`SHOULD_RECORD`/`IS_CI` for holodeck/diagnostic.

| Concern | dev / test | prod | prod + `debug: { LOG_X: true }` | zero-plugin (6.0 dists) |
|---|---|---|---|---|
| asserts | live IIFE, lazy message | statement deleted | deleted | live (DEBUG default true) + one-time warning |
| env branches (incl. the `getOrSetUniversal` TESTING gate and dup-copy throw) | folded to kept branch | folded to other branch — invariants compile exactly as today | same | lenient runtime defaults |
| deprecation/feature branches | folded per `compatWith`/flags (same semver resolution, `DISABLE_7X_DEPRECATIONS`, `WARP_DRIVE_FEATURE_OVERRIDE`) | same | same | deprecated paths on, canary off |
| `LOG_X` unset | `if (false \|\| globalThis.getWarpDriveRuntimeConfig().debug.LOG_X)` → **live-toggleable** | deleted, zero bytes | — | toggles work (ACTIVE default true, seed TESTING=true) |
| `LOG_X` set true | `if (true \|\| …)` always logs | branch kept unconditionally; the global is short-circuit-unreachable | always logs | — |
| `deprecate`/`warn` non-ember | console shim | calls deleted | deleted | console shim via runtime-debug |
| `deprecate`/`warn` ember | real `@ember/debug` | real | real | real |

**The runtime-toggle mechanism is untouched shipped code**: `getOrSetUniversal('WarpDriveRuntimeConfig')`,
sessionStorage persistence under `'WarpDriveRuntimeConfig'`, `globalThis.setWarpDriveLogging` /
`getWarpDriveRuntimeConfig` installed under `if (TESTING)` (kept by our env folding in
dev/test), `setWarpDriveIsMaybeMirage` unconditional. No virtual module participates in the hot
path; toggling needs zero rebuilds; the whole `globalThis` ABI survives byte-identical.

---

## 10. Risks and open questions

1. **esbuild is the weakest adapter** (structural): separate unplugin-esbuild plugins don't
   chain transforms; no `enforce`; no `watchChange`. Scoped `onLoadFilter` + the §4.8 coverage
   assertion mitigate; a second community plugin claiming owned node_modules paths still
   shadows us silently until buildEnd. Angular esbuild consequently gets dist-only
   transformation with seed-corrected app fallback; `@angular-builders/custom-esbuild` is
   community-maintained. Docs must say all of this plainly.
2. **Turbopack**: loader-only, user-maintained globs, JSON options, moving target. Yarn
   PnP/exotic layouts fall through to zero-plugin behavior with only the runtime warning as
   detection. Next-on-webpack is the supported path; the loader is best-effort until Turbopack
   grows real plugin hooks.
3. **Classic-ember 6.0 babel injection** — see §8.3; managed with env-flag bake, documented
   fallback, break-glass dual dist, and a hard GA criterion.
4. **Webpack loader ordering**: `enforce: 'pre'` + rule-unshift generally lands us before
   babel/swc loaders, but userland rule surgery can reorder. The either-order convergence
   property (§6) is the real safety net; a third transform mangling marker strings before us is
   unfixable in principle and detectable via the §7.3 warning.
5. **oxc-parser native dep**: napi + wasm fallback (~5× slower, still ≫ babel). Pin exact
   minor.
6. **Legacy-engine pruning complexity**: the statement-level collapse + kept-range tracking is
   the largest hand-rolled surface. Contained by: expression positions never splice — literal
   replacement only, except the importSync/moduleExists discarded-branch case (§4.3), which
   reuses the statement-collapse machinery; the grammar is closed and golden-tested against
   real dists (including the statement-nesting composites); and the distGrammar tripwire fails
   loudly on drift.
7. **Minifier-dependence at the margins**: expression-position literal residue
   (`true ? a : b`) and carrier-engine dev branches rely on the app minifier in prod. For the
   **legacy carrier**, statement-level shapes (asserts, logging, if-branches — the bulk) are
   pruned by the plugin itself, so a `minify: false` prod pipeline ships only inert expression
   residue. For **Carrier v2 (6.0)**, the carrier engine only inlines consts — a
   `minify: false` 6.0 prod pipeline ships every `false && (assert IIFE)` statement and dead
   deprecation branch as parsed-but-unevaluated residue. Semantically safe, but real bytes; an
   opt-in `prune: 'aggressive'` pass over plugin-minted consts (scope-safe by construction —
   we know exactly which consts we minted) is the designated escape hatch and should land with
   6.0, not after.
8. **Zero-plugin TESTING default** (§7.1): lenient `TESTING=true` keeps toggles alive but
   disarms the dup-copy throw in never-processed builds. Alternative (`TESTING=false`) inverts
   the trade. Needs a maintainer call; the design ships lenient.
9. **`SHOULD_RECORD` zero-plugin default** proposed `false` (never silently record) vs today's
   local-dev-truthy placeholder; holodeck always runs with a plugin/env in practice. Needs
   sign-off.
10. **Naming**: `@warp-drive/build` vs `@warp-drive/unplugin`. This document assumes
    `@warp-drive/build` (the export surface is bigger than unplugin: loader, babel bridge,
    runtime shim); rename is mechanical if the team prefers wearing the ecosystem badge.

---

## Appendix A — Factory sketch

```ts
// @warp-drive/build/src/index.ts
import { createUnplugin } from 'unplugin';
import { parseSync } from 'oxc-parser';
import MagicString from 'magic-string';
import { register, finalize, type ConfigEntry } from './store';
import { legacyEmbroiderPass, carrierPass, emberDebugPass } from './rewrite';

const MARKERS = ['@embroider/macros', '/build-config/', '@ember/debug'];
const OWNED_PATTERNS = ['@warp-drive/*', '@ember-data/*', 'ember-data', 'warp-drive'];

export const warpDrive = createUnplugin<WarpDriveBuildOptions | undefined>((opts = {}, meta) => {
  let entry: ConfigEntry | null = null;
  let root: string | undefined;
  const owned = ownershipMatcher(opts.packages ?? OWNED_PATTERNS); // package.json-name walk

  if (!opts.deferConfig) register(opts.root ?? process.cwd(), opts, { via: 'plugin', from: meta.framework });

  return {
    name: 'warp-drive',
    enforce: 'pre',
    vite: {
      config(c) {
        root = opts.root ?? c.root ?? process.cwd();
        // Vite's exclude is exact-name matching — enumerate concrete installed names,
        // never globs (§0 requirement 1). Correctness, not perf.
        return { optimizeDeps: { exclude: enumerateInstalledOwnedPackages(owned, root) } };
      },
      configResolved(c) { root = opts.root ?? c.root; },
    },
    async buildStart() {
      root ??= opts.root ?? process.cwd();
      if (opts.deferConfig && opts.configFile) await importConfigFile(root, opts.configFile); // registers
      if (!opts.deferConfig) entry = finalize(root, describe(meta));
    },
    transform: {
      filter: {
        id: { include: /\.(m|c)?[jt]sx?([?#]|$)|\.g[jt]s([?#]|$)/, exclude: [/\0/] },
        code: { include: MARKERS },
      },
      handler(code, id) {
        // deferConfig: adopt a registered entry (setConfig ran during bundler-config load,
        // or configFile registered at buildStart) — else hard error naming this file (§5.4).
        entry ??= adoptRegisteredOrThrow(root!, id);
        const owner = owned.ownerOf(id);                    // cached package.json walk
        const src = maybeBlankTemplates(code, id);          // content-tag.parse(), lazy, gts/gjs only
        const parsed = parseSync(id, src, { lang: langFor(id) });
        if (!relevantImports(parsed.module.staticImports, owner)) return null;

        const cached = cacheGet(code, entry, id); if (cached !== undefined) return cached;
        const ms = new MagicString(code);
        const kept = new RangeSet(code.length);
        if (owner.isOwned) legacyEmbroiderPass(parsed, ms, kept, entry, owner);       // §4.3
        carrierPass(parsed, ms, kept, entry, owner);                                   // §4.4
        if (owner.isOwned) emberDebugPass(parsed, ms, kept, entry, opts.emberDebug);   // inline shim
        const res = ms.hasChanged()
          ? { code: ms.toString(), map: ms.generateMap({ hires: 'boundary' }) }
          : null;
        return cachePut(code, entry, id, res);
      },
    },
    buildEnd() { assertCoverage(root, owned); },             // §4.8
  };
});
export default warpDrive;
```

## Appendix B — Representative emitted code

**B.1 Deprecation flag in an `if`** (legacy carrier; simplified from published dist —
`warp-drive-packages/core/dist/graph/-private.js:7`), app has `compatWith: '5.6'` ⇒
`DEPRECATE_NON_STRICT_ID = false`:

```js
// input (simplified from published dist)
if (macroCondition(getGlobalConfig().WarpDrive.deprecations.DEPRECATE_NON_STRICT_ID)) {
  deprecate(`...`, typeof id === 'string', { id: 'ds...', until: '6.0' });
  return String(id);
}
return id;

// output, any mode (branch pruned; deprecate import dropped if now unused)
return id;

// with compatWith '4.12' ⇒ flag true — dev, non-ember (emberDebug 'shim'):
// the @ember/debug import is deleted and the shim preamble is inlined once per file,
// sharing dedup/handler state via a Symbol.for-keyed globalThis slot (§4.3):
const _wdDbg = /* inline shim: */ (globalThis[Symbol.for('warp-drive.debug-shim')] ??= makeShim());
_wdDbg.deprecate(`...`, typeof id === 'string', { id: 'ds...', until: '6.0' });
return String(id);
// prod: the deprecate(...) statement is deleted; return String(id) kept; no preamble emitted.
```

**B.2 Runtime-toggleable LOG flag** (legacy double-if, `core/dist/store-DNF9Rgoh.js:93-95`):

```js
// input
if (macroCondition(getGlobalConfig().WarpDrive.activeLogging.LOG_CACHE_POLICY)) {
  if (getGlobalConfig().WarpDrive.debug.LOG_CACHE_POLICY || globalThis.getWarpDriveRuntimeConfig().debug.LOG_CACHE_POLICY)
    console.log(`CachePolicy: ...`);
}

// dev/test, flag unconfigured — behavioral parity with today's output (byte-parity with
// today's compile-time/prod-mode output; embroider's dev run-time mode instead leaves the
// inner read as a runtime lookup of the same baked value, §1.2). Block braces kept, outer
// header tokens deleted (§4.3 removal-based collapse). Toggle live via
// globalThis.setWarpDriveLogging({ LOG_CACHE_POLICY: true })
{
  if (false || globalThis.getWarpDriveRuntimeConfig().debug.LOG_CACHE_POLICY)
    console.log(`CachePolicy: ...`);
}

// prod, unconfigured: statement deleted.
// prod, configured true: if (true || ...) — global short-circuit-unreachable, invariant kept.
```

**B.3 Assert** (legacy `&&` shape and 6.0 / app-source form):

```js
// legacy input (691 sites)
macroCondition(getGlobalConfig().WarpDrive.env.DEBUG) && ((test) => {
  if (!test) throw new Error(`No self or related link`);
})(this.links?.related || this.links?.self);
// dev: keep the IIFE statement. prod: statement deleted.

// Carrier v2 dist input (6.0): DEBUG && ((test) => { ... })(pred)  — publish-lowered;
// the carrier engine only inlines: /*! wd:cfg */ const DEBUG = false; → minifier drops it.

// app source input
import { assert } from '@warp-drive/core/build-config/macros';
assert(`expected a store`, isStore(candidate));
// dev: ((test) => { if (!test) { throw new Error(`expected a store`); } })(isStore(candidate));
// prod: statement deleted; import dropped.
// zero-plugin: the real runtime assert executes — safe default.
```

**B.4 Expression-position macro** (legacy, literal-replacement rule — no splice, no parens
heuristics):

```js
// input (`types/identifier.js:17`)
return macroCondition(getGlobalConfig().WarpDrive.env.DEBUG) ? Symbol(debugStr) : str;
// dev output:  return true ? Symbol(debugStr) : str;   // minifier folds; semantics identical
// prod output: return false ? Symbol(debugStr) : str;
// exception — discarded branch contains importSync/moduleExists (1 site): splice to kept branch.
```
