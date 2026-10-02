/**
 * The export surface of one source tree: every module a consumer can import from a non-private
 * package, every export of it, and the declaration each export resolves to.
 *
 * Entries come from the build config the package had at that tag (CONTRACT.md "Modules per
 * era"): `addon.publicEntrypoints([...])` in a rollup config, `export const entryPoints = [...]`
 * in a vite or tsdown config, the `addon/` tree of a v1 addon without a build config (and its
 * `addon-test-support/` tree, which ember-cli mounts at `<pkg>/test-support`). Module names come from `package.json#exports` where a vite or tsdown package has one (a pattern key
 * expands against the entry outputs), else from the entry path with `index` dropped. A package
 * without a build config is published as it is: its modules are its `exports` targets or, with
 * no `exports`, the file `main` names.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseSync } from 'oxc-parser';

import { exportsOfFile, type ExportKind, type ExportRecord, type FileExports } from './exports.mts';
import { createResolver, exportTargets, SOURCE_EXTENSIONS, sourceTarget, type PackageLayout } from './resolver.mts';

/** Directories that hold the workspace packages, in any era. */
export const PACKAGE_ROOTS = ['packages', 'warp-drive-packages'];

/** Build configs, newest era first; the first one a package has decides its era. */
const BUILD_CONFIGS = [
  ['tsdown', 'tsdown.config.mjs'],
  ['vite', 'vite.config.mjs'],
  ['rollup', 'rollup.config.mjs'],
] as const;

/** Output directories of the vite and tsdown builds: JS in `dist/`, types in one of these. */
const MODERN_OUT_DIRS = ['dist', 'declarations', 'unstable-preview-types'];

/** Source files a build can take as an entry. */
const ENTRY_SOURCE = /\.(ts|gts|tsx|js|gjs|jsx|mjs)$/;

export type Build = 'rollup' | 'vite' | 'tsdown' | 'v1' | 'none';

export interface Entry {
  /** absolute path of the entry's source file */
  source: string;
  /** the entry's output name without extension, relative to the output directory */
  name: string;
}

export type WorkspacePackage = PackageLayout & {
  rel: string;
  private: boolean;
  build: Build;
  config: string | null;
  entries: Entry[];
};

export interface Token {
  kind: ExportKind;
  decl: string;
  deprecated: boolean;
}

export interface Diagnostic {
  /** a stable identifier for the kind of finding */
  code: string;
  message: string;
}

export interface SurfaceExport {
  kind: ExportKind;
  decl: string;
  deprecated?: true;
}

export interface SurfaceModule {
  package: string;
  entry: string;
  forward: string | null;
  exports: Record<string, SurfaceExport>;
}

export interface Surface {
  schema: 1;
  kind: 'surface';
  version: string;
  tag: string | null;
  packages: Record<string, { dir: string; modules: string[] }>;
  modules: Record<string, SurfaceModule>;
}

/**
 * The surface of the tree at `dir`.
 * @param dir the root of a checkout of this repository
 */
export function surfaceOf(
  dir: string,
  { version, tag, diagnostics = [] }: { version: string; tag: string | null; diagnostics?: Diagnostic[] }
): Surface {
  const root = realpathSync(dir);
  const report = (code: string, message: string) => diagnostics.push({ code, message });

  const workspace = discoverWorkspace(root, report);
  const resolver = createResolver(root, workspace);
  const privateNames = new Set(workspace.filter((p) => p.private).map((p) => p.name));
  for (const conflict of resolver.conflicts) {
    if (!privateNames.has(conflict.name)) report('resolver-conflict', conflict.message);
  }
  const graph = new ExportGraph(root, resolver, report);

  const packages: Surface['packages'] = {};
  const modules: Surface['modules'] = {};
  for (const pkg of workspace) {
    // a second package of the same name was reported as a resolver conflict; the first wins
    if (pkg.private || packages[pkg.name]) continue;
    const found = modulesOf(pkg, report);
    packages[pkg.name] = { dir: pkg.rel, modules: [...found.keys()].sort() };
    for (const [module, entry] of found) {
      if (modules[module]) {
        report('duplicate-module', `${module}: claimed by ${modules[module].package} and ${pkg.name}; the first wins`);
        continue;
      }
      modules[module] = {
        package: pkg.name,
        entry: relative(root, entry),
        forward: graph.fileExports(entry).forward,
        exports: graph.moduleExports(entry, module),
      };
    }
  }
  return { schema: 1, kind: 'surface', version, tag, packages, modules };
}

/**
 * Every workspace package of the tree, private ones included (the resolver needs them all).
 */
export function discoverWorkspace(root: string, report: (code: string, message: string) => void): WorkspacePackage[] {
  const out: WorkspacePackage[] = [];
  for (const base of PACKAGE_ROOTS) {
    const baseDir = path.join(root, base);
    if (!isDir(baseDir)) continue;
    for (const child of readdirSync(baseDir).sort()) {
      const dir = path.join(baseDir, child);
      const manifest = path.join(dir, 'package.json');
      if (!isFile(manifest)) continue;
      const json = JSON.parse(readFileSync(manifest, 'utf8'));
      if (typeof json.name !== 'string') continue;
      // a private package only serves the resolver; its build-config quirks are not findings
      out.push(describePackage(root, dir, json, json.private === true ? () => {} : report));
    }
  }
  return out;
}

/**
 * @param json the parsed package.json
 */
function describePackage(
  root: string,
  dir: string,
  json: any,
  report: (code: string, message: string) => void
): WorkspacePackage {
  const rel = relative(root, dir);
  const base = { name: json.name, dir, rel, private: json.private === true, exports: json.exports };
  const found = BUILD_CONFIGS.find(([, file]) => isFile(path.join(dir, file)));

  if (!found) {
    if (isDir(path.join(dir, 'addon'))) {
      /**
       * @param tree a directory of the addon
       * @param mount where ember-cli puts it under the package name
       */
      const sources = (tree: string, mount: string) =>
        walk(path.join(dir, tree))
          .filter((f) => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'))
          .map((f) => ({ source: path.join(dir, tree, f), name: mount + stripExtension(f) }));
      // ember-cli serves addon-test-support/ as <pkg>/test-support
      const testSupportDir = isDir(path.join(dir, 'addon-test-support')) ? 'addon-test-support' : null;
      const entries = [...sources('addon', ''), ...(testSupportDir ? sources(testSupportDir, 'test-support/') : [])];
      return { ...base, build: 'v1', config: null, srcDir: 'addon', outDirs: [], testSupportDir, entries };
    }
    const layout: WorkspacePackage = {
      ...base,
      build: 'none',
      config: null,
      srcDir: 'src',
      outDirs: ['dist'],
      main: null,
      entries: [],
    };
    if (json.exports === undefined) {
      // published as is: the bare name resolves through `main`, `index.js` when it is absent
      const main = typeof json.main === 'string' ? json.main : 'index.js';
      const mapped = sourceTarget(layout, main.replace(/^\.\//, ''));
      const source = mapped ? findSource(path.join(dir, mapped)) : null;
      if (source) {
        layout.main = relative(dir, source);
        layout.entries.push({ source, name: 'index' });
      } else if (typeof json.main === 'string' && !isFile(path.join(dir, main))) {
        report('target-not-found', `${json.name}: main ${json.main} has no source in the tree`);
      }
    }
    return layout;
  }

  const [build, file] = found;
  const configFile = path.join(dir, file);
  const config = readBuildConfig(configFile);
  const configRel = relative(root, configFile);

  if (build === 'rollup') {
    const srcDir = config.addon.srcDir ?? 'src';
    const destDir = config.addon.destDir ?? 'dist';
    if (!config.entryPoints) report('no-entry-points', `${configRel}: no addon.publicEntrypoints([...]) call`);
    const patterns = (config.entryPoints ?? []).map((p) => globToRegExp(p.replace(/^\.\//, '')));
    const entries: Entry[] = [];
    for (const f of walk(path.join(dir, srcDir))) {
      if (!/\.(ts|gts|gjs|js|hbs)$/.test(f) || f.endsWith('.d.ts')) continue;
      // @embroider/addon-dev matches the output name: the source with its extension swapped for .js
      const output = f.replace(/\.(ts|gts|gjs|hbs)$/, '.js');
      if (patterns.some((re) => re.test(output))) {
        entries.push({ source: path.join(dir, srcDir, f), name: stripExtension(output) });
      }
    }
    for (const p of config.entryPoints ?? []) {
      const re = globToRegExp(p.replace(/^\.\//, ''));
      if (!entries.some((e) => re.test(e.name + '.js'))) {
        report('entry-not-found', `${configRel}: publicEntrypoints '${p}' matches no file under ${srcDir}/`);
      }
    }
    return { ...base, build, config: configRel, srcDir, outDirs: [destDir], entries };
  }

  const srcDir = (config.options.srcDir ?? './src').replace(/^\.\//, '').replace(/\/$/, '');
  if (!config.entryPoints && !config.otherEntry) report('no-entry-points', `${configRel}: no entryPoints array`);
  if (config.otherEntry) {
    report(
      'foreign-entry',
      `${configRel}: builds from \`${config.otherEntry}\`, not entryPoints; only package.json#exports targets in the source tree count`
    );
  }
  const entries: Entry[] = [];
  const seen: Set<string> = new Set();
  for (const pattern of config.entryPoints ?? []) {
    const clean = pattern.replace(/^\.\//, '');
    let files: string[];
    if (/[*{]/.test(clean)) {
      const re = globToRegExp(clean);
      const staticPart = clean.split('/').filter((_, i, all) => !/[*?{[]/.test(all.slice(0, i + 1).join('/')));
      files = walk(path.join(dir, ...staticPart))
        .map((f) => [...staticPart, f].join('/'))
        .filter((f) => re.test(f));
      const declarations = files.filter((f) => f.endsWith('.d.ts'));
      if (declarations.length) {
        report(
          'declaration-entry',
          `${configRel}: '${pattern}' matches ${declarations.join(', ')}; a .d.ts emits no module, skipped`
        );
      }
      files = files.filter((f) => !f.endsWith('.d.ts'));
      if (!files.length) report('entry-not-found', `${configRel}: entryPoints '${pattern}' matches no file`);
    } else if (isFile(path.join(dir, clean))) {
      files = [clean];
    } else {
      report('entry-not-found', `${configRel}: entryPoints '${pattern}' does not exist`);
      files = [];
    }
    for (const f of files) {
      if (seen.has(f)) continue;
      seen.add(f);
      if (!ENTRY_SOURCE.test(f)) continue;
      const inSrc = f.startsWith(srcDir + '/');
      if (!inSrc && !config.options.flatten) {
        report('entry-outside-src', `${configRel}: entry ${f} is outside ${srcDir}/`);
        continue;
      }
      const name = config.options.flatten
        ? stripExtension(path.posix.basename(f))
        : stripExtension(f.slice(srcDir.length + 1));
      entries.push({ source: path.join(dir, f), name });
    }
  }
  return { ...base, build, config: configRel, srcDir, outDirs: MODERN_OUT_DIRS, entries };
}

/**
 * The modules of one package and the entry file each starts at.
 * @returns module name -> absolute entry file
 */
export function modulesOf(pkg: WorkspacePackage, report: (code: string, message: string) => void): Map<string, string> {
  const modules: Map<string, string> = new Map();
  const byExports =
    (pkg.build === 'vite' || pkg.build === 'tsdown' || pkg.build === 'none') && pkg.exports !== undefined;

  if (!byExports) {
    for (const entry of pkg.entries) {
      const sub = entry.name === 'index' ? '' : entry.name.replace(/\/index$/, '');
      const module = sub ? `${pkg.name}/${sub}` : pkg.name;
      if (modules.has(module)) {
        report(
          'duplicate-entry',
          `${module}: both ${relative(pkg.dir, modules.get(module) as string)} and ${relative(pkg.dir, entry.source)}; the first wins`
        );
        continue;
      }
      modules.set(module, entry.source);
    }
    return modules;
  }

  /** build output path (package-relative) -> entry */
  const outputs: Map<string, Entry> = new Map();
  for (const entry of pkg.entries) {
    for (const outDir of pkg.outDirs) {
      outputs.set(`${outDir}/${entry.name}.js`, entry);
      outputs.set(`${outDir}/${entry.name}.d.ts`, entry);
    }
  }
  const keys =
    typeof pkg.exports === 'object' &&
    pkg.exports &&
    !Array.isArray(pkg.exports) &&
    Object.keys(pkg.exports).some((k) => k.startsWith('.'))
      ? Object.keys(pkg.exports)
      : ['.'];
  const targets = exportTargets(pkg.exports);

  /** entry sources an exact key already names */
  const claimed: Set<string> = new Set();
  for (const { key, target } of targets.filter((t) => !t.pattern)) {
    const module = key === '.' ? pkg.name : `${pkg.name}/${key.slice(2)}`;
    let source = outputs.get(target)?.source;
    if (!source) {
      const mapped = sourceTarget(pkg, target);
      source = mapped ? (findSource(path.join(pkg.dir, mapped)) ?? undefined) : undefined;
      if (source && pkg.outDirs.some((d) => target.startsWith(d + '/'))) {
        report(
          'unbuilt-target',
          `${module}: exports target ./${target} is not an entry output; using ${relative(pkg.dir, source)}`
        );
      }
    }
    if (!source) {
      if (/\.(js|mjs|ts|gts|gjs)$/.test(target)) {
        report('target-not-found', `${module}: exports target ./${target} has no source in the tree`);
      }
      continue;
    }
    modules.set(module, source);
    claimed.add(source);
  }
  for (const { key, target } of targets.filter((t) => t.pattern)) {
    const [prefix, suffix, ...rest] = target.split('*');
    const [keyPrefix, keySuffix] = key.slice(2).split('*');
    if (rest.length) continue;
    for (const [output, entry] of outputs) {
      if (output.length < prefix.length + suffix.length || !output.startsWith(prefix) || !output.endsWith(suffix)) {
        continue;
      }
      const star = output.slice(prefix.length, output.length - suffix.length);
      if (!star) continue;
      const subpath = keyPrefix + star + keySuffix;
      if (bestExportsKey(keys, subpath) !== key || claimed.has(entry.source)) continue;
      const module = `${pkg.name}/${subpath}`;
      if (!modules.has(module)) modules.set(module, entry.source);
    }
  }
  const unexported = pkg.entries.filter((e) => ![...modules.values()].includes(e.source));
  if (unexported.length) {
    report(
      'entry-not-exported',
      `${pkg.name}: no exports key reaches ${unexported.map((e) => relative(pkg.dir, e.source)).join(', ')}`
    );
  }
  return modules;
}

/**
 * The exports key node's resolver picks for `./<subpath>`: an exact key, else the pattern key
 * with the longest prefix (then the longest key).
 */
export function bestExportsKey(keys: string[], subpath: string): string | null {
  const request = './' + subpath;
  if (keys.includes(request) && !request.includes('*')) return request;
  let best = null;
  for (const key of keys) {
    const star = key.indexOf('*');
    if (star === -1 || key.indexOf('*', star + 1) !== -1) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (request.length < key.length || !request.startsWith(prefix) || !request.endsWith(suffix)) continue;
    if (request.length === prefix.length + suffix.length) continue;
    if (best === null) best = key;
    else {
      const bestStar = best.indexOf('*');
      if (star > bestStar || (star === bestStar && key.length > best.length)) best = key;
    }
  }
  return best;
}

/**
 * Re-export chains, resolved lazily per (file, name) as ECMAScript's ResolveExport does.
 */
class ExportGraph {
  declare root: string;
  declare resolver: ReturnType<typeof createResolver>;
  declare report: (code: string, message: string) => void;
  declare files: Map<string, FileExports>;
  declare resolved: Map<string, Token | null>;

  constructor(
    root: string,
    resolver: ReturnType<typeof createResolver>,
    report: (code: string, message: string) => void
  ) {
    this.root = root;
    this.resolver = resolver;
    this.report = report;
    this.files = new Map();
    this.resolved = new Map();
  }

  /**
   * @param file absolute
   */
  fileExports(file: string): FileExports {
    let found = this.files.get(file);
    if (!found) {
      try {
        found = exportsOfFile(file);
      } catch (error) {
        found = { exports: [], forward: null, errors: [String(error)] };
      }
      for (const message of found.errors) this.report('parse-error', `${relative(this.root, file)}: ${message}`);
      this.files.set(file, found);
    }
    return found;
  }

  resolve(file: string, specifier: string) {
    return this.resolver.resolve(file, specifier);
  }

  /**
   * Every export of an entry module, keyed by export name.
   * @param entry absolute
   * @param module the module name, for messages
   */
  moduleExports(entry: string, module: string): Record<string, SurfaceExport> {
    const out: Record<string, SurfaceExport> = {};
    for (const name of this.exportedNames(entry, new Set())) {
      const token = this.resolveExport(entry, name, new Set());
      if (!token) {
        this.report('unresolved-export', `${module}: export '${name}' does not resolve (circular or missing)`);
        continue;
      }
      out[name] = token.deprecated
        ? { kind: token.kind, decl: token.decl, deprecated: true }
        : { kind: token.kind, decl: token.decl };
    }
    return out;
  }

  /**
   * ECMAScript GetExportedNames: explicit names, then the names every `export *` brings in.
   */
  exportedNames(file: string, visited: Set<string>): Set<string> {
    const names: Set<string> = new Set();
    if (visited.has(file)) return names;
    visited.add(file);
    const { exports } = this.fileExports(file);
    for (const record of exports) if (record.form !== 'star') names.add(record.name);
    for (const record of exports) {
      if (record.form !== 'star') continue;
      const target = this.resolve(file, record.from);
      if (!('path' in target)) {
        this.report(
          'opaque-star',
          `${relative(this.root, file)}: export * from '${record.from}' leaves the tree; its names are not listed`
        );
        continue;
      }
      for (const name of this.exportedNames(target.path, visited)) if (name !== 'default') names.add(name);
    }
    return names;
  }

  /**
   * ECMAScript ResolveExport: the declaration behind `name` as `file` exports it.
   * @param resolveSet the (file, name) pairs on the current chain
   */
  resolveExport(file: string, name: string, resolveSet: Set<string>): Token | null {
    const key = `${file}\0${name}`;
    if (this.resolved.has(key)) return this.resolved.get(key) as Token | null;
    if (resolveSet.has(key)) return null;
    resolveSet.add(key);
    const { exports } = this.fileExports(file);

    let token: Token | null = null;
    for (const record of exports) {
      if (record.form === 'star' || record.name !== name) continue;
      token = mergeSameName(token, this.tokenOf(file, record, resolveSet));
    }
    if (!token && name !== 'default') {
      let opaque: string | null = null;
      for (const record of exports) {
        if (record.form !== 'star') continue;
        const target = this.resolve(file, record.from);
        if (!('path' in target)) {
          opaque ??= record.from;
          continue;
        }
        const found = this.resolveExport(target.path, name, resolveSet);
        if (!found) continue;
        const typed = record.kind === 'type' ? { ...found, kind: 'type' as ExportKind } : found;
        if (token && token.decl !== typed.decl) {
          this.report(
            'ambiguous-star',
            `${relative(this.root, file)}: '${name}' comes from two stars (${token.decl}, ${typed.decl}); keeping the value, else the first`
          );
          if (token.kind === 'type' && typed.kind === 'value') token = typed;
          continue;
        }
        token = mergeSameName(token, typed);
      }
      if (!token && opaque !== null) {
        token = { kind: 'value', decl: `external:${opaque}#${name}`, deprecated: false };
      }
    }
    resolveSet.delete(key);
    this.resolved.set(key, token);
    return token;
  }

  tokenOf(file: string, record: Exclude<ExportRecord, { form: 'star' }>, resolveSet: Set<string>): Token | null {
    if (record.form === 'local') {
      return { kind: record.kind, decl: `${relative(this.root, file)}#${record.local}`, deprecated: record.deprecated };
    }
    const target = this.resolve(file, record.from);
    if (record.form === 'namespace') {
      const decl = 'path' in target ? `${relative(this.root, target.path)}#*ns` : `external:${record.from}#*ns`;
      if ('error' in target) {
        this.report(
          'unresolved-specifier',
          `${relative(this.root, file)}: '${record.from}' does not resolve (${target.error})`
        );
      }
      return { kind: record.kind, decl, deprecated: record.deprecated };
    }
    if (!('path' in target)) {
      if ('error' in target) {
        this.report(
          'unresolved-specifier',
          `${relative(this.root, file)}: '${record.from}' does not resolve (${target.error})`
        );
      }
      return { kind: record.kind, decl: `external:${record.from}#${record.imported}`, deprecated: record.deprecated };
    }
    const found = this.resolveExport(target.path, record.imported, resolveSet);
    if (!found) {
      this.report(
        'missing-export',
        `${relative(this.root, file)}: '${record.imported}' is not exported by ${relative(this.root, target.path)}`
      );
      return null;
    }
    return {
      kind: record.kind === 'type' || found.kind === 'type' ? 'type' : 'value',
      decl: found.decl,
      deprecated: record.deprecated || found.deprecated,
    };
  }
}

/**
 * A value and a type under one name are one export of kind value.
 */
function mergeSameName(a: Token | null, b: Token | null): Token | null {
  if (!a) return b;
  if (!b) return a;
  const value = a.kind === 'value' ? a : b.kind === 'value' ? b : a;
  return { kind: value.kind, decl: value.decl, deprecated: a.deprecated || b.deprecated };
}

/**
 * Reads what the surface needs from a build config without running it: the entry list and the
 * options handed to `createConfig` (or, for rollup, to `new Addon`).
 */
export function readBuildConfig(file: string): {
  entryPoints: string[] | null;
  otherEntry: string | null;
  options: { srcDir?: string; flatten?: boolean };
  addon: { srcDir?: string; destDir?: string };
} {
  const source = readFileSync(file, 'utf8');
  const { program } = parseSync(file, source, { lang: 'js', sourceType: 'module' });
  let entryPoints: string[] | null = null;
  let otherEntry: string | null = null;
  const options: { srcDir?: string; flatten?: boolean } = {};
  const addon: { srcDir?: string; destDir?: string } = {};

  const strings = (node: any) =>
    node?.type === 'ArrayExpression'
      ? node.elements.filter((e: any) => e?.type === 'Literal' && typeof e.value === 'string').map((e: any) => e.value)
      : null;
  const property = (object: any, key: string) =>
    object?.type === 'ObjectExpression'
      ? object.properties.find((p: any) => p.type === 'Property' && (p.key.name ?? p.key.value) === key)?.value
      : undefined;

  walkAst(program, (node: any) => {
    if (node.type === 'VariableDeclarator' && node.id?.name === 'entryPoints' && node.init) {
      entryPoints = strings(node.init) ?? entryPoints;
    }
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      const calleeName = callee.type === 'MemberExpression' ? callee.property.name : callee.name;
      if (calleeName === 'publicEntrypoints') entryPoints = strings(node.arguments[0]) ?? entryPoints;
      if (calleeName === 'createConfig') {
        const opts = node.arguments[0];
        const srcDir = property(opts, 'srcDir');
        if (srcDir?.type === 'Literal' && typeof srcDir.value === 'string') options.srcDir = srcDir.value;
        const flatten = property(opts, 'flatten');
        if (flatten?.type === 'Literal' && flatten.value === true) options.flatten = true;
        const inline = property(opts, 'entryPoints');
        if (inline?.type === 'ArrayExpression') entryPoints = strings(inline);
      }
      if (calleeName === 'defineConfig') {
        const entry = property(node.arguments[0], 'entry');
        if (entry) otherEntry = source.slice(entry.start, entry.end);
      }
    }
    if (node.type === 'NewExpression' && node.callee.name === 'Addon') {
      for (const key of ['srcDir', 'destDir'] as const) {
        const value = property(node.arguments[0], key);
        if (value?.type === 'Literal' && typeof value.value === 'string') addon[key] = value.value;
      }
    }
  });
  return { entryPoints, otherEntry: entryPoints ? null : otherEntry, options, addon };
}

function walkAst(node: any, visit: (node: any) => void) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walkAst(child, visit);
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (child && typeof child === 'object') walkAst(child, visit);
  }
}

/**
 * node-glob semantics for the patterns build configs use: `**` as a whole segment spans any
 * number of directories, `*` (or `**` inside a segment) stays within one, `?` is one
 * character, `{a,b}` picks one; wildcards do not match a leading dot.
 * @param pattern a POSIX path pattern
 */
export function globToRegExp(pattern: string): RegExp {
  const parts = pattern.split('/');
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1;
    if (parts[i] === '**') {
      out += last ? '(?:(?!\\.)[^/]+(?:/(?!\\.)[^/]+)*)?' : '(?:(?!\\.)[^/]+/)*';
      continue;
    }
    out += (/^[*?]/.test(parts[i]) ? '(?!\\.)' : '') + segmentPattern(parts[i]) + (last ? '' : '/');
  }
  return new RegExp(`^${out}$`);
}

function segmentPattern(segment: string): string {
  let out = '';
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (ch === '*') {
      while (segment[i + 1] === '*') i++;
      out += '[^/]*';
    } else if (ch === '?') {
      out += '[^/]';
    } else if (ch === '{' && segment.indexOf('}', i) > i) {
      const close = segment.indexOf('}', i);
      out += `(?:${segment
        .slice(i + 1, close)
        .split(',')
        .map(segmentPattern)
        .join('|')})`;
      i = close;
    } else if (ch === '[' && segment.indexOf(']', i) > i) {
      const close = segment.indexOf(']', i);
      out += `[${segment
        .slice(i + 1, close)
        .replace(/^!/, '^')
        .replace(/\\/g, '\\\\')}]`;
      i = close;
    } else {
      out += ch.replace(/[.+^$()|\\\]}]/g, '\\$&');
    }
  }
  return out;
}

/**
 * Every file below `dir`, as sorted POSIX paths relative to it; skips `node_modules` and dot
 * directories.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  const visit = (current: string, prefix: string) => {
    let names;
    try {
      names = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    names.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of names) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(path.join(current, entry.name), rel);
      else if (entry.isFile()) out.push(rel);
    }
  };
  visit(dir, '');
  return out;
}

/**
 * The source file a mapped target names: the path itself, or with a source extension, or its
 * `index` file.
 * @param base absolute path, possibly without extension
 */
function findSource(base: string): string | null {
  if (isFile(base) && ENTRY_SOURCE.test(base)) return base;
  for (const ext of SOURCE_EXTENSIONS) if (isFile(base + ext)) return base + ext;
  for (const ext of SOURCE_EXTENSIONS) {
    if (isFile(path.join(base, 'index' + ext))) return path.join(base, 'index' + ext);
  }
  return null;
}

function stripExtension(file: string) {
  return file.replace(/(\.d)?\.(ts|gts|tsx|js|gjs|jsx|mjs|hbs)$/, '');
}

/**
 * @returns POSIX, relative to root
 */
function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/');
}

function isFile(file: string) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDir(dir: string) {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}
