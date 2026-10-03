/**
 * Fixture packages for the audit tests (published.mts, audit.mts and the `audit` command):
 * - `kit/package/` is an exports-map package whose build output lives in `lib/`. `kit.tar.gz` beside
 *   this module is built from it with
 *   `tar --format=pax --pax-option=delete=atime,delete=ctime --sort=name --owner=0 --group=0
 *   --numeric-owner --mtime='2000-01-01 00:00Z' -cf - -C kit package | gzip -9n > kit.tar.gz`
 *   (one file has a path over 100 bytes, so the archive carries a pax header); it is not named
 *   `.tgz` because the repository ignores `dist` and `*.tgz`;
 * - `addon/package/` is a v1 addon, read as an unpacked directory.
 */
import type { Tree } from './tree.mts';

export const tree: Tree = {
  // a v1 addon, as `npm pack` unpacks it
  'addon/package/addon-test-support/index.js': 'export function setupTest() {}\n',
  'addon/package/addon/-private/index.ts': `export interface Options {
  verbose: boolean;
}
export type Mode = 'a' | 'b';
export class Thing {
  mode: Mode = 'a';
}
export function configure(options: Options): void {
  void options;
}
`,
  'addon/package/addon/index-1a2b3c4d.js': `const shared = 1;
export { shared as s };
`,
  'addon/package/addon/index.js': `export { Widget as default } from '@fixture/kit';
export * from '@fixture/kit/widget';
export * from './utils/strings';
`,
  'addon/package/addon/utils/strings.js': `export function dasherize(value) {
  return value.replace(/[A-Z]/g, (char) => \`-\${char.toLowerCase()}\`);
}
export function camelize(value) {
  return value.replace(/-(.)/g, (_, char) => char.toUpperCase());
}
`,
  'addon/package/index.js': `'use strict';

module.exports = { name: '@fixture/addon' };
`,
  'addon/package/package.json': {
    name: '@fixture/addon',
    version: '1.2.3',
    keywords: ['ember-addon'],
    'ember-addon': { main: 'index.js' },
  },

  // an exports-map package, as `npm pack` unpacks it; kit.tar.gz is the packed form
  'kit/package/lib/ambient.js': 'export function ping() {}\n',
  'kit/package/lib/chunk-AbCd1234.js': `const shared = 1;
export { shared as s };
`,
  'kit/package/lib/deep.d.ts': `export declare const deep: true;
declare const _default: 'export * does not re-export a default';
export default _default;
`,
  'kit/package/lib/deep.js': `export const deep = true;
export default 'export * does not re-export a default';
`,
  'kit/package/lib/extra.js': 'export const extra = 1;\n',
  'kit/package/lib/index.d.ts': `export { Widget, makeWidget } from './widget.js';
export type { WidgetOptions } from './widget.js';
export * from './shared.js';
export declare const VERSION: string;
`,
  'kit/package/lib/index.js': `export { Widget, makeWidget } from './widget.js';
export * from './shared.js';
export const VERSION = '1.2.3';
`,
  'kit/package/lib/shared.d.ts': `export * from './deep.js';
export declare function helper(): void;
export declare const DEFAULTS: Readonly<Record<string, unknown>>;
export type Shared = string;
`,
  'kit/package/lib/shared.js': `export * from './deep.js';
export function helper() {}
export const DEFAULTS = Object.freeze({});
`,
  'kit/package/lib/unpkg/deep.js': 'export {};\n',
  'kit/package/lib/unpkg/extra.js': 'export {};\n',
  'kit/package/lib/unpkg/shared.js': 'export {};\n',
  'kit/package/lib/unpkg/widget.js': 'export {};\n',
  'kit/package/lib/widget.d.ts': `/** How a widget is built. */
export interface WidgetOptions {
  /** What the widget shows. */
  label: string;
  size?: number;
}
/** A widget. */
export declare class Widget extends EventTarget {
  // tsc prints a class's private fields as one \`#private\` member
  // oxlint-disable-next-line no-unused-private-class-members
  #private;
  constructor(options: WidgetOptions);
  readonly label: string;
  get size(): number;
  static create(options?: Partial<WidgetOptions>): Widget;
  render(target: HTMLElement, mode?: 'replace' | 'append'): void;
}
export declare function makeWidget(options: WidgetOptions): Widget;
`,
  'kit/package/lib/widget.js': `export class Widget extends EventTarget {
  #options;
  constructor(options) {
    super();
    this.#options = options;
    this.label = options.label;
  }
  get size() {
    return this.#options.size ?? 1;
  }
  static create(options = {}) {
    return new Widget({ label: 'widget', ...options });
  }
  render(target, mode = 'replace') {
    if (mode === 'replace') target.textContent = '';
    target.append(this.label);
  }
}

export function makeWidget(options) {
  return new Widget(options);
}
`,
  'kit/package/package.json': {
    name: '@fixture/kit',
    version: '1.2.3',
    type: 'module',
    exports: {
      '.': { types: './lib/index.d.ts', default: './lib/index.js' },
      './ambient': { default: './lib/ambient.js' },
      './gone': { default: './lib/gone.js' },
      './legacy/*': { default: './legacy/*.cjs' },
      './*': { unpkg: './lib/unpkg/*.js', types: './lib/*.d.ts', default: './lib/*.js' },
    },
  },
  'kit/package/types/ambient-declarations-kept-in-a-directory-with-a-deliberately-long-name/ambient-modules-declared-for-typescript-consumers.d.ts': `declare module '@fixture/kit/ambient' {
  export * from '@fixture/kit/ambient/inner';
  export type Pong = 'pong';
}
declare module '@fixture/kit/ambient/inner' {
  export function ping(): void;
}
`,
};
