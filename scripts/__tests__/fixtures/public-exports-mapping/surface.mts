/**
 * Fixture trees for the surface tests (surface.mts, exports.mts, resolver.mts and the cli.mts loader),
 * one per build era of this repository plus two stand-in command modules. `materialize` from
 * ./tree.mts writes them to disk; the surface scanner reads real files through oxc.
 */
import type { Tree } from './tree.mts';

export const tree: Tree = {
  // stand-in commands for the cli.mts loader tests: one well-behaved, one that names itself wrongly
  'commands/broken.mts': `// A command module that names itself wrongly, for the cli.mts loader tests.
export const name = 'not-broken';
export const describe = 'exports the wrong name';

export async function run() {
  return 0;
}
`,
  'commands/echo.mts': `// A stand-in command for the cli.mts loader tests: records each call, fails on request.
export const name = 'echo';
export const describe = 'records its arguments';

/** @type {{ argv: string[], context: unknown }[]} */
export const calls = [];

/**
 * @param {string[]} argv
 * @param {unknown} context
 * @returns {Promise<number>}
 */
export async function run(argv, context) {
  calls.push({ argv, context });
  if (argv.includes('--usage')) throw new Error('usage: echo [--fail] [--usage]');
  return argv.includes('--fail') ? 3 : 0;
}
`,

  // the rollup era: v1 addons with `addon/` entry points, rollup configs naming the public modules
  'rollup/packages/-meta/addon-test-support/index.js': `export { setupStore } from 'fx-meta/test-support/setup';

export async function render() {}
`,
  'rollup/packages/-meta/addon-test-support/setup.ts': 'export function setupStore(): void {}\n',
  'rollup/packages/-meta/addon-test-support/types.d.ts': `export interface TestContext {
  owner: unknown;
}
`,
  'rollup/packages/-meta/addon/-private/index.ts': "export { Thing } from '@fx/store/-private';\n",
  'rollup/packages/-meta/addon/index.js': `import Store from '@fx/store';

export default Store;
`,
  'rollup/packages/-meta/addon/store.ts': "export { default } from '@fx/store';\n",
  'rollup/packages/-meta/addon/types.d.ts': `export interface NotAModule {
  a: string;
}
`,
  'rollup/packages/-meta/package.json': { name: 'fx-meta', version: '4.12.0', 'ember-addon': {} },
  'rollup/packages/hidden/package.json': { name: '@fx/hidden', private: true },
  'rollup/packages/hidden/rollup.config.mjs': `import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({ srcDir: 'src', destDir: 'addon' });

// a private package only serves the resolver: its missing entry is not reported
export default { plugins: [addon.publicEntrypoints(['index.js', 'missing.js'])] };
`,
  'rollup/packages/hidden/src/index.ts': 'export const hidden = true;\n',
  'rollup/packages/infra/package.json': { name: '@fx/infra' },
  'rollup/packages/infra/src/index.js': 'export const infra = true;\n',
  'rollup/packages/store/package.json': { name: '@fx/store', version: '4.12.0' },
  'rollup/packages/store/rollup.config.mjs': `import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'addon',
});

export default {
  output: addon.output(),
  plugins: [
    // addon.publicEntrypoints(['old.js']),
    addon.publicEntrypoints(['index.js', '-private.js', 'error.js']),
  ],
};
`,
  'rollup/packages/store/src/-private.ts': "export * from './-private/index';\n",
  'rollup/packages/store/src/-private/caches.ts': `/**
 * @deprecated use cacheFor
 */
export function recordIdentifierFor(record: object): string {
  return String(record);
}

export function cacheFor(record: object): object {
  return record;
}
`,
  'rollup/packages/store/src/-private/index.ts': `export { default as Store } from './store-service';
export { Thing } from './thing';
export * from './caches';
`,
  'rollup/packages/store/src/-private/store-service.ts': `export interface StoreOptions {
  lid: string;
}

/**
 * The store.
 */
export default class Store {
  options?: StoreOptions;
}
`,
  'rollup/packages/store/src/-private/thing.js': `export class Thing {
  kind = 'thing';
}
`,
  'rollup/packages/store/src/index.ts': `export { default } from './-private/store-service';
export { recordIdentifierFor, cacheFor } from './-private/caches';
export type { StoreOptions } from './-private/store-service';
`,

  // the tsdown era: exports maps that point at `dist/`, built from `src/` by tsdown configs
  'tsdown/packages/bare/package.json': { name: 'fx-bare', main: './missing.js' },
  'tsdown/packages/cli/package.json': { name: 'fx-cli', bin: { fx: './dist/cli.js' } },
  'tsdown/packages/cli/src/cli.ts': `export { rules as pluginRules } from 'fx-plugin';

export function run(): void {}
`,
  'tsdown/packages/cli/src/commands/index.ts': 'export const commands: string[] = [];\n',
  'tsdown/packages/cli/tsdown.config.mjs': `import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/cli.ts', './src/commands/*.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
`,
  'tsdown/packages/lint/package.json': {
    name: 'fx-lint',
    exports: {
      '.': { default: './src/index.js' },
      './recommended': './src/recommended.js',
      './package.json': './package.json',
    },
  },
  'tsdown/packages/lint/src/index.js': 'export default { rules: {} };\n',
  'tsdown/packages/lint/src/recommended.js': 'export const recommended = {};\n',
  'tsdown/packages/plugin/lib/index.js': 'export const rules = {};\n',
  'tsdown/packages/plugin/package.json': { name: 'fx-plugin', main: './lib/index.js' },
  'tsdown/packages/store/package.json': {
    name: '@fx/store',
    exports: {
      '.': { types: './declarations/index.d.ts', default: './dist/index.js' },
      './*': { types: './declarations/*.d.ts', default: './dist/*.js' },
    },
  },
  'tsdown/packages/store/src/-private.ts': `/**
 * Forwards to the new home of these exports.
 *
 * @module
 */
export * from '@fx/core/store/-private';
export type * from '@fx/core/store/-private';
`,
  'tsdown/packages/store/src/index.ts': `import { Store } from '@fx/core';

export { Store as default };
`,
  'tsdown/packages/store/src/mixed.ts': `export * from '@fx/core/store/-private';
export * from '@fx/core';
`,
  'tsdown/packages/store/tsdown.config.mjs': `import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/index.ts', './src/-private.ts', './src/mixed.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
`,
  'tsdown/warp-drive-packages/core/package.json': {
    name: '@fx/core',
    exports: {
      '.': { types: './declarations/index.d.ts', default: './dist/index.js' },
      './*.cjs': { default: './dist/*.cjs' },
      './*': { types: './declarations/*.d.ts', default: './dist/*.js' },
    },
  },
  'tsdown/warp-drive-packages/core/src/index.ts': `export { Store } from './store/-private/store-service';
export type { StoreOptions } from './store/-private/store-service';
`,
  'tsdown/warp-drive-packages/core/src/store.ts':
    "export { Store as default } from './store/-private/store-service';\n",
  'tsdown/warp-drive-packages/core/src/store/-private.ts': `export { Store, type StoreOptions } from './-private/store-service';
export {
  type LegacyArray,
  /** @deprecated use LegacyArray */
  type LegacyArray as LiveArray,
} from './-private/legacy-array';
`,
  'tsdown/warp-drive-packages/core/src/store/-private/legacy-array.ts': `export class LegacyArray {
  length = 0;
}
`,
  'tsdown/warp-drive-packages/core/src/store/-private/store-service.ts': `export interface StoreOptions {
  lid: string;
}

export class Store {
  options?: StoreOptions;
}
`,
  'tsdown/warp-drive-packages/core/src/types/index.ts': 'export type Brand = string;\n',
  'tsdown/warp-drive-packages/core/src/types/request.ts': `export interface RequestInfo {
  url: string;
}
`,
  'tsdown/warp-drive-packages/core/tsdown.config.mjs': `import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = [
  // './src/old.ts',
  './src/index.ts',
  './src/store.ts',
  './src/store/-private.ts',
  './src/types/**/*.ts',
];

export default createConfig({ entryPoints }, import.meta.resolve);
`,
  'tsdown/warp-drive-packages/ember/app/thing.js': "export { appThing } from '@fx/ember/app/thing';\n",
  'tsdown/warp-drive-packages/ember/package.json': {
    name: '@fx/ember',
    exports: {
      '.': { types: './declarations/index.d.ts', default: './dist/index.js' },
      './mock': { types: './declarations/mock.d.ts', default: './dist/mock.js' },
      './app/*': { default: './app/*.js' },
      './*': { types: './declarations/*.d.ts', default: './dist/*.js' },
    },
  },
  'tsdown/warp-drive-packages/ember/src/-private/hello.gts': '<template>Hello</template>\n',
  'tsdown/warp-drive-packages/ember/src/-private/index.ts': 'export const internal = true;\n',
  'tsdown/warp-drive-packages/ember/src/-private/request.gts': `import Component from '@glimmer/component';

export interface RequestArgs {
  url: string;
}

/**
 * Renders a request, for example:
 *
 * <template><Request @url="/users" /></template>
 */
export class Request extends Component<{ Args: RequestArgs }> {
  get label(): string {
    return \`request to \${this.args.url}\`;
  }

  <template>{{this.label}}</template>
}
`,
  'tsdown/warp-drive-packages/ember/src/app/thing.ts': 'export const appThing = 1;\n',
  'tsdown/warp-drive-packages/ember/src/index.ts': `export { Request, type RequestArgs } from './-private/request.gts';
export { default as Hello } from './-private/hello.gts';
`,
  'tsdown/warp-drive-packages/ember/src/mock.ts': 'export function mock(): void {}\n',
  'tsdown/warp-drive-packages/ember/tsdown.config.mjs': `import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/index.ts', './src/mock.ts', './src/-private/index.ts', './src/app/thing.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
`,

  // the vite era: exports maps built by vite configs, with type-only and star re-exports
  'vite/packages/core-types/package.json': {
    name: '@fx/core-types',
    exports: {
      '.': { types: './unstable-preview-types/index.d.ts', default: './dist/index.js' },
      './*': { types: './unstable-preview-types/*.d.ts', default: './dist/*.js' },
    },
  },
  'vite/packages/core-types/src/-private.ts': `import * as Shapes from './shapes';

export * as symbols from './symbols';
export { Shapes };
`,
  'vite/packages/core-types/src/identifier.ts': `export interface Identifier {
  lid: string;
}

export const ID = Symbol('id');
`,
  'vite/packages/core-types/src/index.ts': `export type { Identifier } from './identifier';
export { ID } from './identifier';
`,
  'vite/packages/core-types/src/schema/fields.ts': `export type Field = { name: string };

/**
 * @deprecated use field
 */
export const legacyField = (name: string): Field => ({ name });

export function field(name: string): Field {
  return { name };
}
`,
  'vite/packages/core-types/src/schema/fields.type-test.ts': 'export {};\n',
  'vite/packages/core-types/src/schema/nested/deep.ts': 'export const deep = true;\n',
  'vite/packages/core-types/src/schema/shapes.d.ts': `export interface Shape {
  sides: number;
}
`,
  'vite/packages/core-types/src/shapes.ts': "export const circle = 'circle';\n",
  'vite/packages/core-types/src/symbols.ts': "export const A = Symbol('a');\n",
  'vite/packages/core-types/vite.config.mjs': `import { createConfig } from '@warp-drive/internal-config/vite/config.js';

export const externals = [];
export const entryPoints = ['./src/index.ts', './src/schema/**.ts', './src/-private.ts'];

export default createConfig({ entryPoints, externals }, import.meta.resolve);
`,
  'vite/packages/store/package.json': {
    name: '@fx/store',
    exports: {
      '.': { types: './unstable-preview-types/index.d.ts', default: './dist/index.js' },
      './*': { types: './unstable-preview-types/*.d.ts', default: './dist/*.js' },
    },
  },
  'vite/packages/store/src/configure.ts': `declare const config: { debug: boolean };

export { config };
export declare function configure(): void;
`,
  'vite/packages/store/src/d.ts': 'export default function D(): void {}\n',
  'vite/packages/store/src/g.ts': `export class G {
  g = 1;
}
`,
  'vite/packages/store/src/index.ts': `import { macroCondition } from '@embroider/macros';

import D from './d';
// oxlint-disable-next-line typescript/consistent-type-imports -- a value import re-exported by \`export type\` is the case under test
import { G } from './g';

export type { G };
export { D, macroCondition };
export { field, legacyField } from '@fx/core-types/schema/fields';
export { default as Thing } from './thing';
export * from './star-a';
export type * from './star-b';
`,
  'vite/packages/store/src/star-a.ts': `export const fromA = 1;

export default 'a default never travels through export *';
`,
  'vite/packages/store/src/star-b.ts': `export class FromB {
  from = 'b';
}
`,
  'vite/packages/store/src/thing.ts': `export default abstract class Thing {
  abstract name: string;
}
`,
  'vite/packages/store/src/types.ts': `export type { Identifier } from '@fx/core-types';
export type { Field } from '@fx/core-types/schema/fields';
`,
  'vite/packages/store/vite.config.mjs': `import { createConfig } from '@warp-drive/internal-config/vite/config.js';

export const entryPoints = ['./src/index.ts', './src/types.ts', 'src/configure.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
`,
};
