import fs from 'fs';
import path from 'path';

import { ember } from '@nullvoxpopuli/ember-rolldown';
import { defineConfig } from 'tsdown';

import { entryPoints, external } from '../rollup/external.js';
import { FixMacroConditionsPlugin } from './fix-macro-conditions.js';
import { MoveTypesToDestination } from './move-types.js';

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
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    deps: {
      neverBundle: external(options.externals),
    },
    plugins: [
      selfReferenceEntries(entryMap),
      ...ember(withMacroImportsAlwaysBabeled(options.ember)),
      FixMacroConditionsPlugin(),
      options.compileTypes ? MoveTypesToDestination(options, resolve) : null,
      ...(options.plugins || []),
    ].filter(Boolean),
  });
}
