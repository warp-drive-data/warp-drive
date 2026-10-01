/**
 * The export surface of one source tree: every module a consumer can import from a non-private
 * package, every export of it, and the declaration each export resolves to.
 *
 * Entries come from the build config the package had at that tag (CONTRACT.md "Modules per
 * era"): `addon.publicEntrypoints([...])` in a rollup config, `export const entryPoints = [...]`
 * in a vite or tsdown config, the `addon/` tree of a v1 addon without a build config. Module
 * names come from `package.json#exports` where a vite or tsdown package has one (a pattern key
 * expands against the entry outputs), else from the entry path with `index` dropped. A package
 * without a build config is published as it is: its modules are its `exports` targets or, with
 * no `exports`, the file `main` names.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseSync } from 'oxc-parser';

import { DATA_ROOT } from './artifacts.mjs';
import { exportsOfFile } from './exports.mjs';
import { createResolver, exportTargets, SOURCE_EXTENSIONS, sourceTarget } from './resolver.mjs';

/** Directories that hold the workspace packages, in any era. */
export const PACKAGE_ROOTS = ['packages', 'warp-drive-packages'];

/** Build configs, newest era first; the first one a package has decides its era. */
const BUILD_CONFIGS = /** @type {const} */ ([
  ['tsdown', 'tsdown.config.mjs'],
  ['vite', 'vite.config.mjs'],
  ['rollup', 'rollup.config.mjs'],
]);

/** Output directories of the vite and tsdown builds: JS in `dist/`, types in one of these. */
const MODERN_OUT_DIRS = ['dist', 'declarations', 'unstable-preview-types'];

/** Source files a build can take as an entry. */
const ENTRY_SOURCE = /\.(ts|gts|tsx|js|gjs|jsx|mjs)$/;

/**
 * @typedef {import('./exports.mjs').ExportKind} ExportKind
 * @typedef {import('./exports.mjs').ExportRecord} ExportRecord
 * @typedef {import('./exports.mjs').FileExports} FileExports
 * @typedef {import('./resolver.mjs').PackageLayout} PackageLayout
 *
 * @typedef {'rollup' | 'vite' | 'tsdown' | 'v1' | 'none'} Build
 *
 * @typedef {object} Entry
 * @property {string} source absolute path of the entry's source file
 * @property {string} name the entry's output name without extension, relative to the output directory
 *
 * @typedef {PackageLayout & { rel: string, private: boolean, build: Build, config: string | null, entries: Entry[] }} WorkspacePackage
 *
 * @typedef {object} Token
 * @property {ExportKind} kind
 * @property {string} decl
 * @property {boolean} deprecated
 *
 * @typedef {object} Diagnostic
 * @property {string} code a stable identifier for the kind of finding
 * @property {string} message
 *
 * @typedef {object} SurfaceExport
 * @property {ExportKind} kind
 * @property {string} decl
 * @property {true} [deprecated]
 *
 * @typedef {object} SurfaceModule
 * @property {string} package
 * @property {string} entry
 * @property {string | null} forward
 * @property {Record<string, SurfaceExport>} exports
 *
 * @typedef {object} Surface
 * @property {1} schema
 * @property {'surface'} kind
 * @property {string} version
 * @property {string | null} tag
 * @property {Record<string, { dir: string, modules: string[] }>} packages
 * @property {Record<string, SurfaceModule>} modules
 */

/**
 * @param {string} version a release version or `head`
 * @param {string} [dataRoot] the artifacts directory
 */
export function surfacePath(version, dataRoot = DATA_ROOT) {
  return path.join(dataRoot, 'surfaces', `${version}.json`);
}

/**
 * The surface of the tree at `dir`.
 * @param {string} dir the root of a checkout of this repository
 * @param {{ version: string, tag: string | null, diagnostics?: Diagnostic[] }} options
 * @returns {Surface}
 */
export function surfaceOf(dir, { version, tag, diagnostics = [] }) {
  const root = realpathSync(dir);
  /** @param {string} code @param {string} message */
  const report = (code, message) => diagnostics.push({ code, message });

  const workspace = discoverWorkspace(root, report);
  const resolver = createResolver(root, workspace);
  const privateNames = new Set(workspace.filter((p) => p.private).map((p) => p.name));
  for (const conflict of resolver.conflicts) {
    if (!privateNames.has(conflict.name)) report('resolver-conflict', conflict.message);
  }
  const graph = new ExportGraph(root, resolver, report);

  /** @type {Surface['packages']} */
  const packages = {};
  /** @type {Surface['modules']} */
  const modules = {};
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
 * @param {string} root
 * @param {(code: string, message: string) => void} report
 * @returns {WorkspacePackage[]}
 */
export function discoverWorkspace(root, report) {
  /** @type {WorkspacePackage[]} */
  const out = [];
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
 * @param {string} root
 * @param {string} dir
 * @param {any} json the parsed package.json
 * @param {(code: string, message: string) => void} report
 * @returns {WorkspacePackage}
 */
function describePackage(root, dir, json, report) {
  const rel = relative(root, dir);
  const base = { name: json.name, dir, rel, private: json.private === true, exports: json.exports };
  const found = BUILD_CONFIGS.find(([, file]) => isFile(path.join(dir, file)));

  if (!found) {
    if (isDir(path.join(dir, 'addon'))) {
      const entries = walk(path.join(dir, 'addon'))
        .filter((f) => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'))
        .map((f) => ({ source: path.join(dir, 'addon', f), name: stripExtension(f) }));
      return { ...base, build: 'v1', config: null, srcDir: 'addon', outDirs: [], entries };
    }
    /** @type {WorkspacePackage} */
    const layout = { ...base, build: 'none', config: null, srcDir: 'src', outDirs: ['dist'], main: null, entries: [] };
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
    /** @type {Entry[]} */
    const entries = [];
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
  /** @type {Entry[]} */
  const entries = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const pattern of config.entryPoints ?? []) {
    const clean = pattern.replace(/^\.\//, '');
    /** @type {string[]} */
    let files;
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
 * @param {WorkspacePackage} pkg
 * @param {(code: string, message: string) => void} report
 * @returns {Map<string, string>} module name -> absolute entry file
 */
export function modulesOf(pkg, report) {
  /** @type {Map<string, string>} */
  const modules = new Map();
  const byExports =
    (pkg.build === 'vite' || pkg.build === 'tsdown' || pkg.build === 'none') && pkg.exports !== undefined;

  if (!byExports) {
    for (const entry of pkg.entries) {
      const sub = entry.name === 'index' ? '' : entry.name.replace(/\/index$/, '');
      const module = sub ? `${pkg.name}/${sub}` : pkg.name;
      if (modules.has(module)) {
        report(
          'duplicate-entry',
          `${module}: both ${relative(pkg.dir, /** @type {string} */ (modules.get(module)))} and ${relative(pkg.dir, entry.source)}; the first wins`
        );
        continue;
      }
      modules.set(module, entry.source);
    }
    return modules;
  }

  /** @type {Map<string, Entry>} build output path (package-relative) -> entry */
  const outputs = new Map();
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

  /** @type {Set<string>} entry sources an exact key already names */
  const claimed = new Set();
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
 * @param {string[]} keys
 * @param {string} subpath
 * @returns {string | null}
 */
export function bestExportsKey(keys, subpath) {
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
  /**
   * @param {string} root
   * @param {ReturnType<typeof createResolver>} resolver
   * @param {(code: string, message: string) => void} report
   */
  constructor(root, resolver, report) {
    this.root = root;
    this.resolver = resolver;
    this.report = report;
    /** @type {Map<string, FileExports>} */
    this.files = new Map();
    /** @type {Map<string, Token | null>} */
    this.resolved = new Map();
  }

  /**
   * @param {string} file absolute
   * @returns {FileExports}
   */
  fileExports(file) {
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

  /**
   * @param {string} file
   * @param {string} specifier
   */
  resolve(file, specifier) {
    return this.resolver.resolve(file, specifier);
  }

  /**
   * Every export of an entry module, keyed by export name.
   * @param {string} entry absolute
   * @param {string} module the module name, for messages
   * @returns {Record<string, SurfaceExport>}
   */
  moduleExports(entry, module) {
    /** @type {Record<string, SurfaceExport>} */
    const out = {};
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
   * @param {string} file
   * @param {Set<string>} visited
   * @returns {Set<string>}
   */
  exportedNames(file, visited) {
    /** @type {Set<string>} */
    const names = new Set();
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
   * @param {string} file
   * @param {string} name
   * @param {Set<string>} resolveSet the (file, name) pairs on the current chain
   * @returns {Token | null}
   */
  resolveExport(file, name, resolveSet) {
    const key = `${file}\0${name}`;
    if (this.resolved.has(key)) return /** @type {Token | null} */ (this.resolved.get(key));
    if (resolveSet.has(key)) return null;
    resolveSet.add(key);
    const { exports } = this.fileExports(file);

    /** @type {Token | null} */
    let token = null;
    for (const record of exports) {
      if (record.form === 'star' || record.name !== name) continue;
      token = mergeSameName(token, this.tokenOf(file, record, resolveSet));
    }
    if (!token && name !== 'default') {
      /** @type {string | null} */
      let opaque = null;
      for (const record of exports) {
        if (record.form !== 'star') continue;
        const target = this.resolve(file, record.from);
        if (!('path' in target)) {
          opaque ??= record.from;
          continue;
        }
        const found = this.resolveExport(target.path, name, resolveSet);
        if (!found) continue;
        const typed = record.kind === 'type' ? { ...found, kind: /** @type {ExportKind} */ ('type') } : found;
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

  /**
   * @param {string} file
   * @param {Exclude<ExportRecord, { form: 'star' }>} record
   * @param {Set<string>} resolveSet
   * @returns {Token | null}
   */
  tokenOf(file, record, resolveSet) {
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
 * @param {Token | null} a
 * @param {Token | null} b
 * @returns {Token | null}
 */
function mergeSameName(a, b) {
  if (!a) return b;
  if (!b) return a;
  const value = a.kind === 'value' ? a : b.kind === 'value' ? b : a;
  return { kind: value.kind, decl: value.decl, deprecated: a.deprecated || b.deprecated };
}

/**
 * Reads what the surface needs from a build config without running it: the entry list and the
 * options handed to `createConfig` (or, for rollup, to `new Addon`).
 * @param {string} file
 * @returns {{ entryPoints: string[] | null, otherEntry: string | null, options: { srcDir?: string, flatten?: boolean }, addon: { srcDir?: string, destDir?: string } }}
 */
export function readBuildConfig(file) {
  const source = readFileSync(file, 'utf8');
  const { program } = parseSync(file, source, { lang: 'js', sourceType: 'module' });
  /** @type {string[] | null} */
  let entryPoints = null;
  /** @type {string | null} */
  let otherEntry = null;
  /** @type {{ srcDir?: string, flatten?: boolean }} */
  const options = {};
  /** @type {{ srcDir?: string, destDir?: string }} */
  const addon = {};

  /** @param {any} node */
  const strings = (node) =>
    node?.type === 'ArrayExpression'
      ? node.elements
          .filter((/** @type {any} */ e) => e?.type === 'Literal' && typeof e.value === 'string')
          .map((/** @type {any} */ e) => e.value)
      : null;
  /** @param {any} object @param {string} key */
  const property = (object, key) =>
    object?.type === 'ObjectExpression'
      ? object.properties.find((/** @type {any} */ p) => p.type === 'Property' && (p.key.name ?? p.key.value) === key)
          ?.value
      : undefined;

  walkAst(program, (/** @type {any} */ node) => {
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
      for (const key of /** @type {const} */ (['srcDir', 'destDir'])) {
        const value = property(node.arguments[0], key);
        if (value?.type === 'Literal' && typeof value.value === 'string') addon[key] = value.value;
      }
    }
  });
  return { entryPoints, otherEntry: entryPoints ? null : otherEntry, options, addon };
}

/**
 * @param {any} node
 * @param {(node: any) => void} visit
 */
function walkAst(node, visit) {
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
 * @param {string} pattern a POSIX path pattern
 * @returns {RegExp}
 */
export function globToRegExp(pattern) {
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

/**
 * @param {string} segment
 * @returns {string}
 */
function segmentPattern(segment) {
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
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} current @param {string} prefix */
  const visit = (current, prefix) => {
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
 * @param {string} base absolute path, possibly without extension
 * @returns {string | null}
 */
function findSource(base) {
  if (isFile(base) && ENTRY_SOURCE.test(base)) return base;
  for (const ext of SOURCE_EXTENSIONS) if (isFile(base + ext)) return base + ext;
  for (const ext of SOURCE_EXTENSIONS) {
    if (isFile(path.join(base, 'index' + ext))) return path.join(base, 'index' + ext);
  }
  return null;
}

/**
 * @param {string} file
 */
function stripExtension(file) {
  return file.replace(/(\.d)?\.(ts|gts|tsx|js|gjs|jsx|mjs|hbs)$/, '');
}

/**
 * @param {string} root
 * @param {string} file
 * @returns {string} POSIX, relative to root
 */
function relative(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

/**
 * @param {string} file
 */
function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * @param {string} dir
 */
function isDir(dir) {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}
