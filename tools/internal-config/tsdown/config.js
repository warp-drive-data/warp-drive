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
      ...ember(options.ember),
      FixMacroConditionsPlugin(),
      options.compileTypes ? MoveTypesToDestination(options, resolve) : null,
      ...(options.plugins || []),
    ].filter(Boolean),
  });
}
