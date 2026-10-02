/**
 * An oxc-resolver configured for one source tree (a release worktree or the working tree).
 *
 * Relative specifiers resolve as a TypeScript build sees them (`./x.js` finds `./x.ts`). A bare
 * specifier that names a workspace package resolves to that package's *source* at this tree:
 * each `package.json#exports` key becomes exactly one alias (oxc-resolver tries aliases in a
 * random order per instance, so one key never gets two aliases), with build outputs mapped back
 * to the source directory (`./dist/*.js` -> `src/*`, `./addon/index.js` -> `src/index`). A
 * subpath the exports do not list falls back to `<srcDir>/<subpath>`, and a v1 addon's
 * `<name>/test-support` is its `addon-test-support/` directory. Nothing ever resolves through
 * `node_modules`: any other bare specifier is external.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { ResolverFactory } from 'oxc-resolver';

/** Source extensions, in the order a TypeScript-first build prefers them. */
export const SOURCE_EXTENSIONS = ['.ts', '.gts', '.tsx', '.js', '.gjs', '.jsx', '.mjs', '.d.ts'];

/** Export conditions an application bundler applies for a browser build; `default` always matches. */
export const CONDITIONS = ['browser', 'import', 'module', 'default'];

/** Extensions a build output can carry; stripped when an output maps back to its source. */
const OUTPUT_EXTENSION = /(\.d\.ts|\.d\.mts|\.mjs|\.js)$/;

/** Targets that are modules: script files, or a pattern target whose `*` stands for the file. */
const MODULE_TARGET = /(\.(js|mjs|ts|mts|gts|gjs|tsx|jsx)|\*)$/;

export interface PackageLayout {
  name: string;
  /** absolute package directory */
  dir: string;
  /** `package.json#exports`, undefined when absent */
  exports: unknown;
  /** directory the build compiles from, relative to `dir` (`src`; `addon` for a v1 addon) */
  srcDir: string;
  /** directories the build writes to, relative to `dir` */
  outDirs: string[];
  /**
   * for a package with neither `exports` nor a build config: the source file its `main` names,
   * relative to `dir`, which is what the bare name resolves to
   */
  main?: string | null;
  /**
   * for a v1 addon: the directory ember-cli serves as `<name>/test-support` (`addon-test-support`),
   * relative to `dir`
   */
  testSupportDir?: string | null;
}

export interface ExportTarget {
  /** the exports key (`.`, `./mock`, `./*`) */
  key: string;
  /** the selected target, package-relative, no leading `./` */
  target: string;
  /** the key holds a `*` */
  pattern: boolean;
}

export type Resolution = { path: string } | { external: string } | { error: string };

/**
 * Picks the target node's resolver would use for `conditions`, honoring key order.
 * @param value an exports value
 */
export function selectTarget(value: unknown, conditions: string[] = CONDITIONS): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const target = selectTarget(item, conditions);
      if (target !== null) return target;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [condition, inner] of Object.entries(value)) {
      if (condition !== 'default' && !conditions.includes(condition)) continue;
      const target = selectTarget(inner, conditions);
      if (target !== null) return target;
    }
  }
  return null;
}

/**
 * The exports keys of a package with the target each selects, in `exports` order. A top-level
 * conditions object or string is the `.` key. Keys whose only targets need other conditions
 * (`node`, `require`) are left out; a key with only a `types` target keeps it.
 */
export function exportTargets(exports: unknown): ExportTarget[] {
  if (exports === undefined || exports === null) return [];
  const entries: [string, unknown][] =
    typeof exports === 'string' || Array.isArray(exports) || !Object.keys(exports).some((k) => k.startsWith('.'))
      ? [['.', exports]]
      : Object.entries(exports as Record<string, unknown>);
  const out: ExportTarget[] = [];
  for (const [key, value] of entries) {
    const target = selectTarget(value) ?? selectTarget(value, ['types']);
    if (target === null) continue;
    out.push({ key, target: target.replace(/^\.\//, ''), pattern: key.includes('*') });
  }
  return out;
}

/**
 * Maps an exports target to the source path it is built from, relative to the package:
 * `dist/foo.js` -> `src/foo`, `dist/*.js` -> `src/*`, `src/index.js` -> `src/index.js`.
 * Returns null for a target that is not a module (`.css`, `.cjs`, `package.json`) or that lies
 * outside both the output and the source directories (`app/*`, `blueprints/*`).
 * @param target package-relative, no leading `./`
 */
export function sourceTarget(pkg: PackageLayout, target: string): string | null {
  if (!MODULE_TARGET.test(target) && !OUTPUT_EXTENSION.test(target)) return null;
  for (const outDir of pkg.outDirs) {
    if (target.startsWith(outDir + '/')) {
      return pkg.srcDir + '/' + target.slice(outDir.length + 1).replace(OUTPUT_EXTENSION, '');
    }
  }
  if (target.startsWith(pkg.srcDir + '/')) return target;
  if (!target.includes('*') && isFile(path.join(pkg.dir, target)) && MODULE_TARGET.test(target)) return target;
  return null;
}

function isFile(file: string) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * The aliases for one package: one per exports key with a source target; for a package
 * without `exports`, the `.` and `./*` keys a classic build gives it (`<srcDir>/index`, or the
 * file `main` names when there is no build, and `<srcDir>/*`).
 */
export function packageAliases(pkg: PackageLayout): { key: string; alias: string; target: string }[] {
  const targets =
    pkg.exports === undefined
      ? [
          { key: '.', target: pkg.main ?? pkg.srcDir + '/index', pattern: false },
          { key: './*', target: pkg.srcDir + '/*', pattern: true },
        ]
      : exportTargets(pkg.exports);
  const out: { key: string; alias: string; target: string }[] = [];
  for (const { key, target, pattern } of targets) {
    const source = pkg.exports === undefined ? target : sourceTarget(pkg, target);
    if (source === null) continue;
    // a pattern key and its target hold one `*` each; anything else cannot be an alias
    if (pattern && (source.split('*').length !== 2 || key.split('*').length !== 2)) continue;
    const subpath = key === '.' ? '' : key.slice(1);
    if (pattern && !key.endsWith('*')) continue; // `./*.cjs`: no source counterpart
    const alias = pattern ? pkg.name + subpath : pkg.name + subpath + '$';
    out.push({ key, alias, target: path.join(pkg.dir, source) });
  }
  return out;
}

/**
 * @param root absolute, real path of the source tree
 * @param packages every workspace package of the tree, private ones included
 */
export function createResolver(root: string, packages: PackageLayout[]) {
  const alias: Record<string, string[]> = {};
  const byName: Map<string, PackageLayout> = new Map();
  const rel = (dir: string) => path.relative(root, dir).split(path.sep).join('/');
  const conflicts: { name: string; message: string }[] = [];
  for (const pkg of packages) {
    if (byName.has(pkg.name)) {
      conflicts.push({
        name: pkg.name,
        message: `${pkg.name}: declared by ${rel(byName.get(pkg.name)?.dir ?? '')} and ${rel(pkg.dir)}; the first wins`,
      });
      continue;
    }
    byName.set(pkg.name, pkg);
    for (const entry of packageAliases(pkg)) alias[entry.alias] = [entry.target];
  }

  const factory = new ResolverFactory({
    alias,
    extensions: SOURCE_EXTENSIONS,
    extensionAlias: { '.js': ['.ts', '.gts', '.tsx', '.js', '.gjs', '.jsx', '.d.ts'] },
    conditionNames: CONDITIONS,
    exportsFields: [],
    importsFields: [],
    mainFields: [],
    mainFiles: ['index'],
    modules: [],
    nodePath: false,
  });

  /** precedence fixes for exact keys a pattern alias shadows */
  const exact: Map<string, { path: string } | null> = new Map();
  /** packages whose pattern keys overlap */
  const ordered: Map<string, { alias: string; target: string }[]> = new Map();
  for (const pkg of byName.values()) {
    const entries = packageAliases(pkg);
    const patterns = entries.filter((e) => !e.alias.endsWith('$'));
    for (const e of entries) {
      if (!e.alias.endsWith('$')) continue;
      const specifier = e.alias.slice(0, -1);
      const shadowing = patterns.filter((p) => specifier.startsWith(p.alias.slice(0, -1)));
      if (!shadowing.length) continue;
      const own = factory.sync(root, e.target).path ?? null;
      for (const p of shadowing) {
        const viaPattern = factory.sync(root, p.target.replace('*', specifier.slice(p.alias.length - 1))).path ?? null;
        if (viaPattern !== own) {
          conflicts.push({
            name: pkg.name,
            message: `${specifier}: exports key ${e.key} and ${p.key} resolve differently; ${e.key} wins`,
          });
          exact.set(specifier, own === null ? null : { path: own });
        }
      }
    }
    // two pattern aliases where one prefix contains the other would race inside oxc-resolver:
    // resolve that package's patterns here instead, longest prefix first as node does
    const overlap = patterns.some((x) => patterns.some((y) => x !== y && x.alias.startsWith(y.alias.slice(0, -1))));
    if (overlap) {
      const longestFirst = [...patterns].sort((x, y) => y.alias.length - x.alias.length);
      ordered.set(pkg.name, longestFirst);
    }
  }

  const workspacePackage = (specifier: string): PackageLayout | undefined => {
    const parts = specifier.split('/');
    const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    return byName.get(name);
  };

  return {
    root,
    alias,
    conflicts,
    /**
     * @param fromFile absolute path of the importing file
     */
    resolve(fromFile: string, specifier: string): Resolution {
      const fromDir = path.dirname(fromFile);
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const result = factory.sync(fromDir, specifier);
        return result.path ? inside(root, result.path, specifier) : { error: result.error ?? 'not found' };
      }
      const pkg = workspacePackage(specifier);
      if (!pkg) return { external: specifier };
      const mounted = testSupportPath(pkg, specifier);
      if (mounted) {
        const result = factory.sync(fromDir, mounted);
        return result.path
          ? inside(root, result.path, specifier)
          : { error: result.error ?? `${specifier}: not found` };
      }
      const fixed = exact.get(specifier);
      if (fixed !== undefined) {
        return fixed ? inside(root, fixed.path, specifier) : { error: `${specifier}: not found` };
      }
      const pattern = ordered.get(pkg.name)?.find((p) => specifier.startsWith(p.alias.slice(0, -1)));
      const result = pattern
        ? factory.sync(fromDir, pattern.target.replace('*', specifier.slice(pattern.alias.length - 1)))
        : factory.sync(fromDir, specifier);
      if (result.path) return inside(root, result.path, specifier);
      // a subpath the exports do not list: `<srcDir>/<subpath>`
      const subpath = specifier.slice(pkg.name.length + 1) || 'index';
      for (const base of [pkg.srcDir, 'src', 'addon']) {
        const candidate = path.join(pkg.dir, base, subpath);
        if (!existsSync(path.dirname(candidate))) continue;
        const fallback = factory.sync(fromDir, candidate);
        if (fallback.path) return inside(root, fallback.path, specifier);
      }
      return { error: result.error ?? `${specifier}: not found` };
    },
  };
}

/**
 * The file a v1 addon's `<name>/test-support[/<path>]` names, null for any other specifier.
 */
function testSupportPath(pkg: PackageLayout, specifier: string): string | null {
  if (!pkg.testSupportDir) return null;
  const mount = `${pkg.name}/test-support`;
  if (specifier !== mount && !specifier.startsWith(mount + '/')) return null;
  return path.join(pkg.dir, pkg.testSupportDir, specifier.slice(mount.length + 1) || 'index');
}

function inside(root: string, file: string, specifier: string): Resolution {
  const rel = path.relative(root, file);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).includes('node_modules')) {
    return { external: specifier };
  }
  return { path: file };
}
