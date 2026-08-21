import fs from 'fs';
import { createRequire, isBuiltin } from 'module';
import path from 'path';

import { ember } from '@nullvoxpopuli/ember-rolldown';
import { id, include } from '@rolldown/pluginutils';
import { babel } from '@rollup/plugin-babel';
import { defineConfig } from 'tsdown';

import { entryPoints, explicitExternals, external } from '../rollup/external.js';

/**
 * Vite/Rollup's own resolver implements Node's "self-referencing a package
 * using its name" (https://nodejs.org/api/packages.html#self-referencing-a-package-using-its-name)
 * out of the box, which is why source files can `import ... from '@warp-drive/core/build-config/env'`
 * and have it resolve to the local `./src/build-config/env.ts` entry during
 * the build itself. Rolldown's default resolver does not resolve these the
 * same way, so bare self-referencing imports would otherwise fall through to
 * (and be rejected by) the external-dependency guardrail below. This plugin
 * maps them back to the matching entry point before that guardrail ever sees them.
 */
function selfReferenceEntries(entryMap) {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf-8'));
  const pkgName = pkg.name;

  return {
    name: 'warp-drive:self-reference-entries',
    resolveId: {
      order: 'pre',
      handler(id) {
        if (id !== pkgName && !id.startsWith(pkgName + '/')) {
          return null;
        }
        const subpath = id === pkgName ? 'index' : id.slice(pkgName.length + 1);
        return entryMap[subpath] ?? null;
      },
    },
  };
}

/**
 * `@nullvoxpopuli/ember-rolldown`'s `ember()` plugin only routes a file through babel
 * (where our own assert()/DEBUG/deprecation/etc macro-stripping plugins run) when it
 * imports from a known-babel-requiring package, or when its source text happens to
 * match a decorator-looking pattern (`@\w+`, e.g. `@tracked`). Neither heuristic knows
 * about `@warp-drive/build-config`, so a file that uses `assert()`/`DEBUG`/etc but has
 * no decorators -- and no incidental `@word` text outside a same-line comment, since the
 * decorator heuristic's comment-exclusion doesn't span multiple lines -- silently skips
 * babel entirely, leaving those calls unstripped in every build (dev and prod alike).
 * Explicitly listing our own macro import sources here makes stripping unconditional
 * instead of dependent on that guesswork.
 */
const WARP_DRIVE_MACRO_IMPORTS = [
  '@warp-drive/build-config/macros',
  '@warp-drive/core/build-config/macros',
  '@warp-drive/build-config/env',
  '@warp-drive/core/build-config/env',
  '@warp-drive/build-config/debugging',
  '@warp-drive/core/build-config/debugging',
  '@warp-drive/build-config/deprecations',
  '@warp-drive/core/build-config/deprecations',
  '@warp-drive/build-config/canary-features',
  '@warp-drive/core/build-config/canary-features',
];

/**
 * `@nullvoxpopuli/ember-rolldown`'s `ember()` plugin bundles its own
 * `emberExternals()` resolveId hook (also `order: 'pre'`), which unconditionally
 * marks anything listed in this package's own `dependencies`/`peerDependencies`
 * as external -- there's no option to turn that off. That's the right default
 * for a normal library build, but it defeats `explicitExternalsOnly` (used for
 * builds meant to be fully self-contained, e.g. a standalone cjs bundle, where
 * even a peerDependency subpath import should be inlined). Since the first
 * `resolveId` hook to return a definitive result wins, placing this plugin
 * ahead of `ember()`'s plugins in the array lets it resolve (and keep
 * non-external) anything not in the explicit externals list before
 * `emberExternals()` ever sees it. `this.resolve()` isn't usable to find the
 * real file here: it re-enters the same plugin pipeline (`skipSelf` only
 * skips this plugin, not `emberExternals()`), so it would just hit that same
 * early `false` return again -- external, without ever touching the
 * filesystem. Resolving via Node's own resolver directly sidesteps the
 * plugin pipeline entirely.
 */
function forceBundleOverEmberExternals(options) {
  if (!options.explicitExternalsOnly) {
    return null;
  }
  const manual = new Set(options.externals ?? []);

  return {
    name: 'warp-drive:force-bundle-over-ember-externals',
    resolveId: {
      order: 'pre',
      handler(id, importer) {
        if (!importer || manual.has(id) || id.startsWith('.') || id.includes(':') || isBuiltin(id)) {
          return null;
        }
        try {
          const resolvedPath = createRequire(importer).resolve(id);
          return { id: resolvedPath, external: false };
        } catch {
          return null;
        }
      },
    },
  };
}

function withMacroImportsAlwaysBabeled(emberOptions) {
  const userImports = emberOptions?.babel?.filter?.include?.imports ?? [];
  return {
    ...emberOptions,
    babel: {
      ...emberOptions?.babel,
      filter: {
        ...emberOptions?.babel?.filter,
        include: {
          ...emberOptions?.babel?.filter?.include,
          imports: [...WARP_DRIVE_MACRO_IMPORTS, ...userImports],
        },
      },
    },
  };
}

/**
 * `@nullvoxpopuli/ember-build-tooling-utils`'s `maybeBabel()` (which powers
 * `ember()`'s babel routing) matches against a hardcoded extension allowlist
 * that mirrors Embroider's canonical Ember source extensions -- `.gjs`/`.gts`/
 * `.js`/`.ts`/etc -- and does not include `.jsx`/`.tsx`. Its file-extension
 * check is an AND-gate alongside the imports/decorator heuristics, so a
 * `.tsx` file is *never* routed through babel by `ember()`, regardless of
 * what it imports: `assert()`/macro calls in `.tsx` files silently survive
 * unstripped into every build (dev and prod alike) otherwise. This runs a
 * second, independent babel pass scoped to just `.jsx`/`.tsx`, reusing
 * whatever babel config the package already has (auto-discovered, same as
 * `ember()`'s own babel step) so JSX/macro/decorator handling stays
 * consistent with `.ts`/`.gts` files in the same package.
 */
function jsxBabel() {
  const plugin = babel({
    babelHelpers: 'bundled',
    extensions: ['.jsx', '.tsx'],
  });
  // `@rollup/plugin-babel`'s own `extensions`-based file matching isn't
  // honored by rolldown's transform pipeline (only rolldown-native `filter`
  // objects are) -- same reason `maybeBabel()` above sets this explicitly
  // rather than trusting the plugin's own `extensions` option.
  plugin.transform.filter = [include(id(/\.[jt]sx$/))];
  return { ...plugin, enforce: 'pre', name: 'warp-drive:jsx-babel' };
}

export function createConfig(options, resolve) {
  options.srcDir = options.srcDir ?? './src';
  options.compileTypes = options.compileTypes ?? true;
  options.outDir = options.outDir ?? 'dist';

  const entryMap = entryPoints(options.entryPoints, resolve, options);

  return defineConfig({
    entry: entryMap,
    outDir: options.outDir,
    clean: options.emptyOutDir ?? true,
    format: options.format ?? 'esm',
    platform: 'neutral',
    target: options.target ?? ['esnext', 'firefox121'],
    sourcemap: true,
    minify: false,
    report: false,
    dts: options.compileTypes ? { sourcemap: true } : false,
    // Keep `.js` for esm output (matching this repo's existing `exports` maps),
    // but a `format: 'cjs'` build (e.g. a standalone cjs bundle) needs the
    // real `.cjs` extension -- these packages don't set `"type": "module"`,
    // so plain `.js` would otherwise be ambiguous/wrong for a cjs artifact.
    outExtensions: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js', dts: '.d.ts' }),
    deps: {
      // `explicitExternalsOnly` opts out of the default "every declared
      // dependency/peerDependency is external" behavior. This is for builds
      // meant to be fully self-contained (e.g. a standalone cjs bundle) where
      // even a peerDependency subpath import should be inlined rather than
      // left as a bare specifier for the consumer to resolve. tsdown/rolldown's
      // dependency plugin externalizes any bare (node_modules-style) import by
      // default regardless of `neverBundle`, so opting out also requires
      // `alwaysBundle` to force everything but the explicit list back in.
      neverBundle: options.explicitExternalsOnly ? explicitExternals(options.externals) : external(options.externals),
      alwaysBundle: options.explicitExternalsOnly ? (id) => !explicitExternals(options.externals)(id) : undefined,
      // A self-contained bundle bundling its dependencies on purpose doesn't
      // need tsdown's "did you mean to bundle this?" hint on every build.
      onlyBundle: options.explicitExternalsOnly ? false : undefined,
    },
    plugins: [
      selfReferenceEntries(entryMap),
      forceBundleOverEmberExternals(options),
      ...ember(withMacroImportsAlwaysBabeled(options.ember)),
      options.jsx ? jsxBabel() : null,
      ...(options.plugins || []),
    ].filter(Boolean),
  });
}
