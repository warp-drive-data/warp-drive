/**
 * The package as published on npm, from a cached tarball (area C of CONTRACT.md).
 *
 * - `packagesAt(version)` lists the non-private packages of a release tag (the working tree for
 *   `head`), each with the version its own `package.json` names at that tag.
 * - `fetchTarball(name, version)` runs `npm pack` once per name and version into a cache outside
 *   the repository and reports `unpublished` when the registry has no such version.
 * - `readPublished(source)` describes one tarball (or an unpacked package directory): its
 *   `exports` map, the targets that do not ship, its modules, and per module the runtime export
 *   names (from the JS the `import`/`default` condition resolves to) and the type export names
 *   (from the `.d.ts` the `types` condition resolves to, the `.d.ts` beside the JS, a shipped
 *   `.ts` source, or an ambient `declare module` block), following `export *` and re-exports.
 * - `PublishedRelease` ties the packages of one release together, so an `export * from` another
 *   package of the release resolves too, and prints declaration shapes from the `.d.ts` files.
 *
 * Module names derive from the package as published:
 * - `exports`: every key with `./` dropped; a pattern key expands against the files of the
 *   tarball its runtime target (else its types target) matches, keeping only the files Node
 *   resolves back to that key, skipping files that live under the target of a more specific
 *   condition of the same key (the `unpkg` builds) and files an explicit key already names;
 * - a v1 addon (`ember-addon.version` 1, as 4.12 and 5.0 publish): every `.js`/`.ts` under
 *   `addon/` as `<pkg>/<path>` and under `addon-test-support/` as `<pkg>/test-support/<path>`,
 *   `index` dropped;
 * - otherwise `main` (or `index.js`) as the package itself.
 * In the first two, a file whose name ends in a bundler content hash (`-cc461d33`, `-BwVo-2vv`)
 * is a shared build chunk rather than an entry: it is listed under `chunks`, not as a module.
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { parseSync } from 'oxc-parser';

import { REPO_ROOT } from './artifacts.mjs';

const execFileAsync = promisify(execFile);

/** Members of a class shape beyond this many are summarized in one line. */
export const MAX_CLASS_MEMBERS = 40;
/** Characters of a type, interface, enum or namespace body (and of one class member) a shape keeps. */
export const MAX_BODY = 2000;

const MANIFEST = /^(?:packages|warp-drive-packages)\/[^/]+\/package\.json$/;
const CODE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const DTS = /\.d\.[cm]?ts$/;
const TYPES_FILE = /\.d\.[cm]?ts$|\.[cm]?tsx?$/;
const EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;

/**
 * @typedef {{ name: string, dir: string, version: string }} PackageRef
 * @typedef {{ name: string, version: string, status: 'cached' | 'fetched' | 'unpublished', path: string | null }} Tarball
 * @typedef {(request: { name: string, version: string, destination: string }) => Promise<string | null>} Pack
 *   writes the tarball of `name@version` into `destination` and resolves to its path, or to `null`
 *   when the registry has no such version
 * @typedef {{ file: string, ambient: boolean }} TypesTarget
 * @typedef {{ runtime: string | null, types: TypesTarget | null }} ModuleTargets
 * @typedef {Record<string, Record<string, string[]>>} Missing  exports key -> condition -> targets
 * @typedef {{ modulesFrom: 'exports' | 'addon' | 'main', missing: Missing, chunks: string[], modules: Map<string, ModuleTargets> }} Layout
 * @typedef {{ pkg: PublishedPackage, file: string, scope: string | null }} Ref
 *   a file of a package, or (`scope`) the `declare module '<scope>'` block inside it
 * @typedef {{ local: string, type: boolean }} LocalBinding
 * @typedef {{ from: string, imported: string, type: boolean }} ReexportBinding
 * @typedef {{ from: string, namespace: true, type: boolean }} NamespaceBinding
 * @typedef {LocalBinding | ReexportBinding | NamespaceBinding} Binding
 * @typedef {{
 *   exports: Map<string, Binding>,
 *   stars: { from: string, type: boolean }[],
 *   imports: Map<string, { from: string, imported: string, type: boolean }>,
 *   declarations: Map<string, any[]>,
 * }} Scope
 * @typedef {{ pkg: PublishedPackage, file: string, scope: string | null, local: string, viaDefault: boolean }} Declaration
 * @typedef {{ file: string, names: string[], ambient?: true }} NamesRecord
 * @typedef {{ runtime: NamesRecord | null, types: NamesRecord | null, unresolved?: string[] }} ModuleRecord
 * @typedef {{
 *   version: string, published: true, modulesFrom: Layout['modulesFrom'], exports: unknown,
 *   missing: Missing, chunks: string[], modules: Record<string, ModuleRecord>, parseErrors?: string[],
 * }} PublishedRecord
 */

/** @param {string} a @param {string} b */
function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {Iterable<string>} values
 * @returns {string[]}
 */
function sorted(values) {
  return [...values].sort(compare);
}

/**
 * @param {string[]} args
 * @param {string} cwd
 */
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
}

// ---------------------------------------------------------------------------------------------
// Packages of a release

/**
 * The non-private packages of a release: every `packages/*` and `warp-drive-packages/*`
 * directory with a `package.json` at tag `v<version>` (the working tree for `head`), with the
 * version that `package.json` names, which is not always the repository's version.
 * @param {string} version  a release version, or `head`
 * @param {{ cwd?: string }} [options]
 * @returns {PackageRef[]}
 */
export function packagesAt(version, { cwd = REPO_ROOT } = {}) {
  const manifests = version === 'head' ? workingTreeManifests(cwd) : tagManifests(`v${version}`, cwd);
  /** @type {Map<string, PackageRef>} */
  const found = new Map();
  for (const { file, json } of manifests) {
    const manifest = JSON.parse(json);
    if (manifest.private || typeof manifest.name !== 'string') continue;
    const dir = path.posix.dirname(file);
    const other = found.get(manifest.name);
    if (other) throw new Error(`${manifest.name} is declared by both ${other.dir} and ${dir} at ${version}`);
    found.set(manifest.name, { name: manifest.name, dir, version: String(manifest.version) });
  }
  return [...found.values()].sort((a, b) => compare(a.name, b.name));
}

/**
 * @param {string} tag
 * @param {string} cwd
 */
function tagManifests(tag, cwd) {
  return git(['ls-tree', '-r', '--name-only', tag, '--', 'packages', 'warp-drive-packages'], cwd)
    .split('\n')
    .filter((file) => MANIFEST.test(file))
    .map((file) => ({ file, json: git(['show', `${tag}:${file}`], cwd) }));
}

/** @param {string} cwd */
function workingTreeManifests(cwd) {
  const manifests = [];
  for (const root of ['packages', 'warp-drive-packages']) {
    const base = path.join(cwd, root);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const file = path.join(base, entry.name, 'package.json');
      if (entry.isDirectory() && existsSync(file)) {
        manifests.push({ file: `${root}/${entry.name}/package.json`, json: readFileSync(file, 'utf8') });
      }
    }
  }
  return manifests.sort((a, b) => compare(a.file, b.file));
}

// ---------------------------------------------------------------------------------------------
// Tarball cache

/**
 * Where tarballs are cached: `$WARP_DRIVE_EXPORTS_CACHE` when set, else
 * `.cache/warp-drive-public-exports` beside the primary checkout, so every worktree of a clone
 * shares one cache and the cache never lives inside a repository.
 * @returns {string}
 */
export function defaultCacheDir() {
  const fromEnv = process.env.WARP_DRIVE_EXPORTS_CACHE;
  if (fromEnv) return path.resolve(fromEnv);
  let checkout;
  try {
    checkout = path.dirname(git(['rev-parse', '--path-format=absolute', '--git-common-dir'], REPO_ROOT).trim());
  } catch {
    checkout = REPO_ROOT;
  }
  return path.join(path.dirname(checkout), '.cache', 'warp-drive-public-exports');
}

/**
 * The path a tarball is cached at: `<cacheDir>/<name with / replaced by +>/<version>.tgz`.
 * @param {string} cacheDir
 * @param {string} name
 * @param {string} version
 */
export function tarballPath(cacheDir, name, version) {
  return path.join(cacheDir, name.replace('/', '+'), `${version}.tgz`);
}

/**
 * The default `Pack`: `npm pack <name>@<version> --pack-destination <destination>`, run with the
 * destination (outside the repository, whose `devEngines` npm would enforce) as its cwd.
 * @type {Pack}
 */
export async function npmPack({ name, version, destination }) {
  const spec = `${name}@${version}`;
  let stdout;
  try {
    ({ stdout } = await execFileAsync('npm', ['pack', spec, '--pack-destination', destination, '--json'], {
      cwd: destination,
      maxBuffer: 1 << 26,
    }));
  } catch (error) {
    const reply = parseJson(/** @type {{ stdout?: string }} */ (error).stdout);
    const code = reply?.error?.code;
    if (code === 'E404' || code === 'ETARGET') return null;
    const detail = reply?.error?.summary ?? /** @type {Error} */ (error).message;
    throw new Error(`npm pack ${spec} failed${code ? ` (${code})` : ''}: ${detail}`, { cause: error });
  }
  const reply = parseJson(stdout);
  const filename = Array.isArray(reply) ? reply[0]?.filename : undefined;
  if (typeof filename !== 'string') throw new Error(`npm pack ${spec} did not report the file it wrote`);
  return path.join(destination, filename);
}

/** @param {string | undefined} text */
function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * The tarball of `name@version`, packed into the cache the first time and read from it after
 * that. A version the registry does not have is `unpublished`, not an error; it is not cached,
 * so a package published after its tag was cut is picked up by the next run.
 * @param {string} name
 * @param {string} version
 * @param {{ cacheDir?: string, pack?: Pack }} [options]
 * @returns {Promise<Tarball>}
 */
export async function fetchTarball(name, version, { cacheDir = defaultCacheDir(), pack = npmPack } = {}) {
  const file = tarballPath(cacheDir, name, version);
  if (existsSync(file)) return { name, version, status: 'cached', path: file };
  mkdirSync(path.dirname(file), { recursive: true });
  const packed = await pack({ name, version, destination: path.dirname(file) });
  if (packed === null) return { name, version, status: 'unpublished', path: null };
  if (path.resolve(packed) !== file) renameSync(packed, file);
  return { name, version, status: 'fetched', path: file };
}

// ---------------------------------------------------------------------------------------------
// Reading a tarball

/**
 * Reads a gzipped tar (an npm tarball) into memory: path inside the package, with the leading
 * `package/` directory dropped, to its bytes. Handles ustar prefixes, pax and GNU long names.
 * @param {string} file
 * @returns {Map<string, Buffer>}
 */
export function readTarball(file) {
  const data = gunzipSync(readFileSync(file));
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  /** @type {string | null} */
  let longName = null;
  let offset = 0;
  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const size = octal(header.subarray(124, 136));
    const type = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    const body = data.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') {
      longName = cString(body);
      continue;
    }
    if (type === 'x') {
      longName = paxPath(body) ?? longName;
      continue;
    }
    if (type === 'g') continue;
    const entry = (longName ?? headerName(header)).replace(/^\.\//, '');
    longName = null;
    const slash = entry.indexOf('/');
    if ((type === '0' || type === '7') && slash !== -1) files.set(entry.slice(slash + 1), Buffer.from(body));
  }
  return files;
}

/** @param {Buffer} bytes */
function cString(bytes) {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end === -1 ? bytes.length : end).toString('utf8');
}

/** @param {Buffer} bytes */
function octal(bytes) {
  if (bytes[0] & 0x80) {
    let value = 0;
    for (let i = 1; i < bytes.length; i++) value = value * 256 + bytes[i];
    return value;
  }
  return parseInt(cString(bytes).trim() || '0', 8);
}

/** @param {Buffer} header */
function headerName(header) {
  const name = cString(header.subarray(0, 100));
  const ustar = header.subarray(257, 263).toString('latin1') === 'ustar\0';
  const prefix = ustar ? cString(header.subarray(345, 500)) : '';
  return prefix ? `${prefix}/${name}` : name;
}

/**
 * The `path` record of a pax extended header (`<length> <key>=<value>\n`, length in bytes).
 * @param {Buffer} body
 * @returns {string | null}
 */
function paxPath(body) {
  /** @type {string | null} */
  let found = null;
  let position = 0;
  while (position < body.length) {
    const space = body.indexOf(0x20, position);
    if (space === -1) break;
    const length = Number(body.subarray(position, space).toString('latin1'));
    if (!length) break;
    const record = body.subarray(space + 1, position + length - 1).toString('utf8');
    const equals = record.indexOf('=');
    if (record.slice(0, equals) === 'path') found = record.slice(equals + 1);
    position += length;
  }
  return found;
}

/**
 * @param {string} root
 * @returns {Map<string, Buffer>}
 */
function readDirectory(root) {
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const relative = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile()) files.set(relative, readFileSync(path.join(root, relative)));
    }
  };
  walk('');
  return files;
}

/**
 * Opens a published package: a `.tgz` from the registry, or an unpacked package directory (the
 * directory holding its `package.json`).
 * @param {string} source
 * @returns {PublishedPackage}
 */
export function openPublished(source) {
  return new PublishedPackage(statSync(source).isDirectory() ? readDirectory(source) : readTarball(source));
}

/**
 * Describes one published package on its own: re-exports from other packages stay unresolved
 * (listed per module under `unresolved`); `auditOf` resolves them across the whole release.
 * @param {string} source  a `.tgz`, or an unpacked package directory
 * @returns {PublishedRecord}
 */
export function readPublished(source) {
  const pkg = openPublished(source);
  return new PublishedRelease([pkg]).describe(pkg);
}

// ---------------------------------------------------------------------------------------------
// One package

/**
 * A shared build chunk rather than an entry: the file name ends in `-` and an eight character
 * content hash with a digit or capital in it (`index-cc461d33.js`, `many-array-BwVo-2vv.js`).
 * @param {string} file
 */
export function isChunk(file) {
  const stem = path.posix.basename(file).replace(EXTENSION, '');
  const match = /-([\w-]{8})$/.exec(stem);
  return match !== null && match.index > 0 && /[0-9A-Z]/.test(match[1]);
}

export class PublishedPackage {
  /** @type {Map<string, { source: string, program: any, comments: any[], isModule: boolean }>} */
  #parsed = new Map();
  /** @type {Map<string, Scope>} */
  #scopes = new Map();
  /** @type {Map<string, { file: string, node: any }> | null} */
  #ambient = null;
  /** @type {Layout | null} */
  #layout = null;

  /** @param {Map<string, Buffer>} files  path inside the package -> bytes */
  constructor(files) {
    const manifest = files.get('package.json');
    if (!manifest) throw new Error('the package has no package.json');
    this.files = files;
    this.manifest = JSON.parse(manifest.toString('utf8'));
    /** @type {string} */
    this.name = this.manifest.name;
    /** @type {string} */
    this.version = this.manifest.version;
    /** @type {Map<string, string[]>} file -> parse errors */
    this.errors = new Map();
  }

  /** @param {string} file */
  has(file) {
    return this.files.has(file);
  }

  /** @param {string} file */
  parse(file) {
    let parsed = this.#parsed.get(file);
    if (!parsed) {
      const source = /** @type {Buffer} */ (this.files.get(file)).toString('utf8');
      const result = parseSync(file, source, { lang: langOf(file), sourceType: 'module' });
      const errors = result.errors.filter((e) => e.severity === 'Error').map((e) => e.message);
      if (errors.length) this.errors.set(file, errors);
      parsed = { source, program: result.program, comments: result.comments, isModule: result.module.hasModuleSyntax };
      this.#parsed.set(file, parsed);
    }
    return parsed;
  }

  /**
   * Ambient module declarations (`declare module '<specifier>' { ... }` at the top of a `.d.ts`
   * that is not itself a module), as the `unstable-preview-types` of 5.4 to 5.8 ship them.
   * @returns {Map<string, { file: string, node: any }>}
   */
  get ambient() {
    if (!this.#ambient) {
      this.#ambient = new Map();
      for (const file of sorted(this.files.keys())) {
        if (!DTS.test(file)) continue;
        const text = /** @type {Buffer} */ (this.files.get(file)).toString('utf8');
        if (!/declare\s+module\s+['"]/.test(text)) continue;
        const { program, isModule } = this.parse(file);
        if (isModule) continue;
        for (const statement of program.body) {
          const id = statement.type === 'TSModuleDeclaration' ? statement.id : null;
          if (id?.type === 'Literal' && statement.body && !this.#ambient.has(id.value)) {
            this.#ambient.set(id.value, { file, node: statement });
          }
        }
      }
    }
    return this.#ambient;
  }

  /** @returns {Layout} */
  get layout() {
    this.#layout ??= layoutOf(this);
    return this.#layout;
  }

  /**
   * What a file (or an ambient module block in it) declares, imports and exports.
   * @param {Ref} ref
   * @returns {Scope}
   */
  scope(ref) {
    const key = `${ref.file}\0${ref.scope ?? ''}`;
    let scope = this.#scopes.get(key);
    if (!scope) {
      if (!CODE.test(ref.file)) {
        scope = emptyScope();
      } else if (ref.scope !== null) {
        const ambient = this.ambient.get(ref.scope);
        scope = ambient ? scopeOf(ambient.node.body.body, { implicitExports: true }) : emptyScope();
      } else {
        const { program, isModule } = this.parse(ref.file);
        scope = scopeOf(program.body, { implicitExports: DTS.test(ref.file) && isModule });
      }
      this.#scopes.set(key, scope);
    }
    return scope;
  }

  /**
   * A relative specifier from `ref`, as a file of this package.
   * @param {Ref} ref
   * @param {string} specifier
   * @param {'runtime' | 'types'} flavor
   * @returns {Ref | null}
   */
  resolveRelative(ref, specifier, flavor) {
    if (ref.scope !== null) return null;
    const base = path.posix.join(path.posix.dirname(ref.file), specifier);
    const candidates = flavor === 'types' ? typesCandidates(base) : runtimeCandidates(base);
    const file = candidates.find((candidate) => this.has(candidate));
    return file ? { pkg: this, file, scope: null } : null;
  }

  /**
   * The declaration's shape as its file prints it.
   * @param {Declaration} declaration
   */
  shape(declaration) {
    const nodes = this.scope(declaration).declarations.get(declaration.local) ?? [];
    const { source, comments } = this.parse(declaration.file);
    const printer = new Printer(source, comments);
    return nodes
      .map((node) => shapeOf(printer, node, declaration.local))
      .filter(Boolean)
      .join('\n');
  }
}

/** @param {string} file */
function langOf(file) {
  if (DTS.test(file)) return 'dts';
  if (/\.tsx$/.test(file)) return 'tsx';
  if (/\.[cm]?ts$/.test(file)) return 'ts';
  if (/\.jsx$/.test(file)) return 'jsx';
  return 'js';
}

/** @param {string} base */
function runtimeCandidates(base) {
  return [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.ts`, `${base}/index.js`, `${base}/index.ts`];
}

/** @param {string} base */
function typesCandidates(base) {
  const js = /\.([cm]?)js$/.exec(base);
  if (js) {
    const stem = base.slice(0, -js[0].length);
    return [`${stem}.d.${js[1]}ts`, `${stem}.${js[1]}ts`];
  }
  if (TYPES_FILE.test(base)) return [base];
  return [`${base}.d.ts`, `${base}.ts`, `${base}/index.d.ts`, `${base}/index.ts`];
}

/**
 * The `.d.ts` TypeScript looks for beside a resolved JS file.
 * @param {string} file
 * @returns {string | null}
 */
function siblingTypes(file) {
  const js = /\.([cm]?)js$/.exec(file);
  return js ? `${file.slice(0, -js[0].length)}.d.${js[1]}ts` : null;
}

/** @param {string} target */
function clean(target) {
  return target.replace(/^\.\//, '');
}

// ---------------------------------------------------------------------------------------------
// Module list

/**
 * @param {PublishedPackage} pkg
 * @returns {Layout}
 */
function layoutOf(pkg) {
  const field = pkg.manifest.exports;
  const map = field === undefined || field === null ? null : subpathMap(field);
  const fromExports = map ? exportsLayout(pkg, map) : null;
  const addon = pkg.manifest['ember-addon'];
  const v1 = addon !== null && typeof addon === 'object' && (addon.version ?? 1) === 1;
  if (v1 && [...pkg.files.keys()].some((file) => file.startsWith('addon/') && isSource(file))) {
    const fromAddon = addonLayout(pkg);
    return {
      modulesFrom: 'addon',
      missing: fromExports?.missing ?? {},
      chunks: sorted(new Set([...(fromExports?.chunks ?? []), ...fromAddon.chunks])),
      modules: fromAddon.modules,
    };
  }
  if (fromExports) return { modulesFrom: 'exports', ...fromExports };
  return { modulesFrom: 'main', missing: {}, chunks: [], modules: mainLayout(pkg) };
}

/** @param {string} file */
function isSource(file) {
  return CODE.test(file) && !DTS.test(file);
}

/**
 * `exports` as a subpath map: a string, an array or a conditions object is the `.` entry.
 * @param {unknown} field
 * @returns {Record<string, unknown>}
 */
function subpathMap(field) {
  if (typeof field !== 'object' || field === null || Array.isArray(field)) return { '.': field };
  const keys = Object.keys(field);
  if (keys.length && keys.every((key) => !key.startsWith('.'))) return { '.': field };
  return /** @type {Record<string, unknown>} */ (field);
}

/**
 * Every string target of an `exports` entry with the conditions leading to it.
 * @param {unknown} target
 * @param {string[]} [conditions]
 * @returns {{ conditions: string[], target: string }[]}
 */
function leavesOf(target, conditions = []) {
  if (typeof target === 'string') return [{ conditions, target }];
  if (Array.isArray(target)) return target.flatMap((item) => leavesOf(item, conditions));
  if (target && typeof target === 'object') {
    return Object.entries(target).flatMap(([condition, item]) => leavesOf(item, [...conditions, condition]));
  }
  return [];
}

/** @param {string[]} conditions */
function conditionName(conditions) {
  return conditions.length ? conditions.join('.') : 'default';
}

/**
 * Node's condition matching: the first key in object order that is `default` or one of
 * `conditions` and itself resolves. `undefined` when nothing matches, `null` when excluded.
 * @param {unknown} target
 * @param {string[]} conditions
 * @returns {string | null | undefined}
 */
function pickTarget(target, conditions) {
  if (typeof target === 'string') return target;
  if (target === null) return null;
  if (Array.isArray(target)) {
    for (const item of target) {
      const picked = pickTarget(item, conditions);
      if (typeof picked === 'string') return picked;
    }
    return undefined;
  }
  if (typeof target === 'object') {
    for (const [condition, item] of Object.entries(/** @type {object} */ (target))) {
      if (condition !== 'default' && !conditions.includes(condition)) continue;
      const picked = pickTarget(item, conditions);
      if (picked !== undefined) return picked;
    }
  }
  return undefined;
}

/**
 * The runtime file of an entry: the `import`/`default` target, else (node-only entries) the
 * `node`/`require` one.
 * @param {unknown} target
 */
function runtimeTarget(target) {
  const picked = pickTarget(target, ['import']);
  return picked === undefined ? pickTarget(target, ['node', 'require']) : picked;
}

/** @param {unknown} target */
function typesTarget(target) {
  return pickTarget(target, ['types', 'import']);
}

/**
 * Node's PATTERN_KEY_COMPARE: negative when `a` is the more specific key.
 * @param {string} a
 * @param {string} b
 */
function patternKeyCompare(a, b) {
  const aStar = a.indexOf('*');
  const bStar = b.indexOf('*');
  const aBase = aStar === -1 ? a.length : aStar + 1;
  const bBase = bStar === -1 ? b.length : bStar + 1;
  if (aBase !== bBase) return aBase > bBase ? -1 : 1;
  if (aStar === -1) return 1;
  if (bStar === -1) return -1;
  if (a.length !== b.length) return a.length > b.length ? -1 : 1;
  return 0;
}

/**
 * The key Node resolves `subpath` through, with the text the `*` stands for.
 * @param {Record<string, unknown>} map
 * @param {string} subpath
 * @returns {{ key: string, star: string | null } | null}
 */
function matchKey(map, subpath) {
  if (!subpath.includes('*') && Object.hasOwn(map, subpath)) return { key: subpath, star: null };
  /** @type {{ key: string, star: string } | null} */
  let best = null;
  for (const key of Object.keys(map)) {
    const star = key.indexOf('*');
    if (star === -1 || star !== key.lastIndexOf('*')) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (!subpath.startsWith(prefix) || subpath.length < key.length || !subpath.endsWith(suffix)) continue;
    if (!best || patternKeyCompare(best.key, key) === 1) {
      best = { key, star: subpath.slice(star, subpath.length - suffix.length) };
    }
  }
  return best;
}

/**
 * The text `*` stands for when `file` matches the pattern target, else null.
 * @param {string} pattern
 * @param {string} file
 */
function matchTarget(pattern, file) {
  const parts = clean(pattern).split('*');
  if (parts.length < 2) return null;
  const prefix = parts[0];
  const suffix = parts[parts.length - 1];
  if (!file.startsWith(prefix) || !file.endsWith(suffix) || file.length <= prefix.length + suffix.length) return null;
  if (parts.length === 2) return file.slice(prefix.length, file.length - suffix.length);
  // every `*` of a target stands for the same text
  const escaped = parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const match = new RegExp(`^${escaped[0]}(.+?)${escaped.slice(1).join('\\1')}$`).exec(file);
  return match ? match[1] : null;
}

/** @param {string} pattern */
function staticPrefix(pattern) {
  const target = clean(pattern);
  return target.slice(0, target.indexOf('*'));
}

/**
 * @param {string} pkgName
 * @param {string} subpath  `.` or `./<path>`
 */
function moduleName(pkgName, subpath) {
  return subpath === '.' ? pkgName : `${pkgName}${subpath.slice(1)}`;
}

/**
 * @param {PublishedPackage} pkg
 * @param {Record<string, unknown>} map
 * @returns {Omit<Layout, 'modulesFrom'>}
 */
function exportsLayout(pkg, map) {
  const files = sorted(pkg.files.keys());
  /** @type {Record<string, Record<string, Set<string>>>} */
  const missing = {};
  /** @param {string} key @param {string[]} conditions @param {string} target */
  const addMissing = (key, conditions, target) => {
    ((missing[key] ??= {})[conditionName(conditions)] ??= new Set()).add(target);
  };
  /** @type {Set<string>} */
  const chunks = new Set();
  /** @type {{ module: string, key: string, star: string | null }[]} */
  const candidates = [];
  /** @type {Set<string>} */
  const explicitFiles = new Set();
  /** @type {Map<string, Set<string>>} pattern key -> conditions whose pattern matches no file */
  const emptyPatterns = new Map();

  for (const [key, target] of Object.entries(map)) {
    if (key.includes('*')) continue;
    for (const leaf of leavesOf(target)) {
      if (!leaf.target.endsWith('/') && !pkg.has(clean(leaf.target))) addMissing(key, leaf.conditions, leaf.target);
    }
    const runtime = runtimeTarget(target);
    if (typeof runtime === 'string') explicitFiles.add(clean(runtime));
    candidates.push({ module: moduleName(pkg.name, key), key, star: null });
  }

  for (const [key, target] of Object.entries(map)) {
    if (!key.includes('*')) continue;
    const leaves = leavesOf(target).filter((leaf) => leaf.target.includes('*'));
    const empty = new Set();
    for (const leaf of leaves) {
      if (!files.some((file) => matchTarget(leaf.target, file) !== null)) {
        addMissing(key, leaf.conditions, leaf.target);
        empty.add(conditionName(leaf.conditions));
      }
    }
    emptyPatterns.set(key, empty);
    const runtime = runtimeTarget(target);
    const types = typesTarget(target);
    const driver = typeof runtime === 'string' ? runtime : types;
    if (typeof driver !== 'string' || !driver.includes('*')) continue;
    const prefix = staticPrefix(driver);
    const nested = leaves
      .map((leaf) => staticPrefix(leaf.target))
      .filter((other) => other !== prefix && other.startsWith(prefix));
    for (const file of files) {
      const star = matchTarget(driver, file);
      if (star === null || nested.some((other) => file.startsWith(other))) continue;
      const subpath = key.replaceAll('*', star);
      if (matchKey(map, subpath)?.key !== key) continue;
      if (isChunk(file)) chunks.add(file);
      else if (!explicitFiles.has(file)) candidates.push({ module: moduleName(pkg.name, subpath), key, star });
    }
  }

  /** @type {Map<string, ModuleTargets>} */
  const modules = new Map();
  for (const { module, key, star } of candidates) {
    if (modules.has(module)) continue;
    const target = map[key];
    /** @param {string} value */
    const resolve = (value) => clean(star === null ? value : value.replaceAll('*', star));
    if (star !== null) {
      for (const leaf of leavesOf(target)) {
        if (!leaf.target.includes('*') || emptyPatterns.get(key)?.has(conditionName(leaf.conditions))) continue;
        if (!pkg.has(resolve(leaf.target))) addMissing(key, leaf.conditions, `./${resolve(leaf.target)}`);
      }
    }
    const runtime = runtimeTarget(target);
    const runtimeFile = typeof runtime === 'string' && pkg.has(resolve(runtime)) ? resolve(runtime) : null;
    const types = typesTarget(target);
    /** @type {TypesTarget | null} */
    const typesFile =
      typeof types === 'string' && TYPES_FILE.test(types)
        ? pkg.has(resolve(types))
          ? { file: resolve(types), ambient: false }
          : null
        : siblingOrAmbient(pkg, module, runtimeFile);
    modules.set(module, { runtime: runtimeFile, types: typesFile });
  }

  /** @type {Missing} */
  const frozen = {};
  for (const [key, byCondition] of Object.entries(missing)) {
    frozen[key] = {};
    for (const [condition, targets] of Object.entries(byCondition)) frozen[key][condition] = sorted(targets);
  }
  return { missing: frozen, chunks: sorted(chunks), modules: sortedMap(modules) };
}

/**
 * Types for a module with no `types` condition: a TypeScript source is its own types, else the
 * `.d.ts` beside its JS, else an ambient `declare module` of the module's name.
 * @param {PublishedPackage} pkg
 * @param {string} module
 * @param {string | null} runtimeFile
 * @returns {TypesTarget | null}
 */
function siblingOrAmbient(pkg, module, runtimeFile) {
  if (runtimeFile && TYPES_FILE.test(runtimeFile)) return { file: runtimeFile, ambient: false };
  const sibling = runtimeFile ? siblingTypes(runtimeFile) : null;
  if (sibling && pkg.has(sibling)) return { file: sibling, ambient: false };
  const ambient = pkg.ambient.get(module);
  return ambient ? { file: ambient.file, ambient: true } : null;
}

/**
 * @param {PublishedPackage} pkg
 * @returns {{ chunks: string[], modules: Map<string, ModuleTargets> }}
 */
function addonLayout(pkg) {
  const entries = [...pkg.files.keys()]
    .filter((file) => /^addon(?:-test-support)?\//.test(file) && isSource(file))
    .map((file) => {
      const testSupport = file.startsWith('addon-test-support/');
      const relative = file.slice(file.indexOf('/') + 1).replace(EXTENSION, '');
      const index = relative === 'index' || relative.endsWith('/index');
      const base = relative === 'index' ? '' : index ? relative.slice(0, -'/index'.length) : relative;
      const subpath = testSupport ? ['test-support', base].filter(Boolean).join('/') : base;
      return { file, index, module: subpath ? `${pkg.name}/${subpath}` : pkg.name };
    })
    .sort(
      (a, b) =>
        compare(a.module, b.module) ||
        Number(a.index) - Number(b.index) ||
        Number(!a.file.endsWith('.js')) - Number(!b.file.endsWith('.js')) ||
        compare(a.file, b.file)
    );
  /** @type {Set<string>} */
  const chunks = new Set();
  /** @type {Map<string, ModuleTargets>} */
  const modules = new Map();
  for (const { file, module } of entries) {
    if (isChunk(file)) chunks.add(file);
    else if (!modules.has(module)) modules.set(module, { runtime: file, types: siblingOrAmbient(pkg, module, file) });
  }
  return { chunks: sorted(chunks), modules };
}

/**
 * @param {PublishedPackage} pkg
 * @returns {Map<string, ModuleTargets>}
 */
function mainLayout(pkg) {
  const main = typeof pkg.manifest.main === 'string' ? clean(pkg.manifest.main) : 'index.js';
  const runtime = runtimeCandidates(main).find((file) => pkg.has(file)) ?? null;
  const declared = pkg.manifest.types ?? pkg.manifest.typings;
  const declaredFile =
    typeof declared === 'string' ? typesCandidates(clean(declared)).find((file) => pkg.has(file)) : undefined;
  const types = declaredFile ? { file: declaredFile, ambient: false } : siblingOrAmbient(pkg, pkg.name, runtime);
  return runtime || types ? new Map([[pkg.name, { runtime, types }]]) : new Map();
}

/**
 * @template T
 * @param {Map<string, T>} map
 * @returns {Map<string, T>}
 */
function sortedMap(map) {
  return new Map([...map].sort(([a], [b]) => compare(a, b)));
}

// ---------------------------------------------------------------------------------------------
// What a file exports

/** @returns {Scope} */
function emptyScope() {
  return { exports: new Map(), stars: [], imports: new Map(), declarations: new Map() };
}

/** @param {any} node */
function nameOf(node) {
  return node.type === 'Literal' ? String(node.value) : node.name;
}

/**
 * @param {any} pattern
 * @returns {string[]}
 */
function patternNames(pattern) {
  if (!pattern) return [];
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name];
    case 'ObjectPattern':
      return pattern.properties.flatMap((/** @type {any} */ property) =>
        patternNames(property.type === 'RestElement' ? property.argument : property.value)
      );
    case 'ArrayPattern':
      return pattern.elements.flatMap(patternNames);
    case 'AssignmentPattern':
      return patternNames(pattern.left);
    case 'RestElement':
      return patternNames(pattern.argument);
    default:
      return [];
  }
}

/**
 * The bindings a declaration statement introduces.
 * @param {any} node
 * @returns {string[]}
 */
function declaredNames(node) {
  switch (node.type) {
    case 'VariableDeclaration':
      return node.declarations.flatMap((/** @type {any} */ declarator) => patternNames(declarator.id));
    case 'ClassDeclaration':
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
    case 'TSEnumDeclaration':
      return node.id ? [node.id.name] : [];
    case 'TSModuleDeclaration':
      return node.id?.type === 'Identifier' && node.kind !== 'global' ? [node.id.name] : [];
    default:
      return [];
  }
}

/**
 * A declaration that leaves nothing at runtime.
 * @param {any} node
 */
function isTypeOnlyDeclaration(node) {
  if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration') return true;
  if (node.type === 'TSEnumDeclaration' && node.const) return true;
  return Boolean(node.declare);
}

/**
 * Exports, star re-exports, imports and declarations of a statement list: a module's body or an
 * ambient module block. In an ambient context without any `export {}`, `export *`, `export =` or
 * `export default <expression>`, every declaration is exported, as TypeScript treats it.
 * @param {any[]} statements
 * @param {{ implicitExports: boolean }} options
 * @returns {Scope}
 */
function scopeOf(statements, { implicitExports }) {
  const scope = emptyScope();
  /** @param {string} id @param {any} node */
  const declare = (id, node) => {
    const list = scope.declarations.get(id);
    if (list) list.push(node);
    else scope.declarations.set(id, [node]);
  };
  let explicit = false;
  /** @type {string[]} */
  const unexported = [];
  for (const statement of statements) {
    switch (statement.type) {
      case 'ImportDeclaration':
        for (const specifier of statement.specifiers ?? []) {
          const imported =
            specifier.type === 'ImportDefaultSpecifier'
              ? 'default'
              : specifier.type === 'ImportNamespaceSpecifier'
                ? '*'
                : nameOf(specifier.imported);
          const type = statement.importKind === 'type' || specifier.importKind === 'type';
          scope.imports.set(specifier.local.name, { from: statement.source.value, imported, type });
        }
        break;
      case 'ExportNamedDeclaration':
        if (statement.declaration) {
          for (const id of declaredNames(statement.declaration)) {
            declare(id, statement.declaration);
            scope.exports.set(id, { local: id, type: statement.exportKind === 'type' });
          }
        } else {
          explicit = true;
          for (const specifier of statement.specifiers) {
            const exported = nameOf(specifier.exported);
            const local = nameOf(specifier.local);
            const type = statement.exportKind === 'type' || specifier.exportKind === 'type';
            scope.exports.set(
              exported,
              statement.source ? { from: statement.source.value, imported: local, type } : { local, type }
            );
          }
        }
        break;
      case 'ExportDefaultDeclaration': {
        const node = statement.declaration;
        if (/^(?:ClassDeclaration|FunctionDeclaration|TSDeclareFunction|TSInterfaceDeclaration)$/.test(node.type)) {
          const local = node.id ? node.id.name : 'default';
          declare(local, node);
          scope.exports.set('default', { local, type: isTypeOnlyDeclaration(node) });
        } else {
          explicit = true;
          scope.exports.set('default', { local: node.type === 'Identifier' ? node.name : 'default', type: false });
        }
        break;
      }
      case 'ExportAllDeclaration':
        explicit = true;
        if (statement.exported) {
          scope.exports.set(nameOf(statement.exported), {
            from: statement.source.value,
            namespace: true,
            type: statement.exportKind === 'type',
          });
        } else {
          scope.stars.push({ from: statement.source.value, type: statement.exportKind === 'type' });
        }
        break;
      case 'TSExportAssignment':
        explicit = true;
        break;
      default:
        for (const id of declaredNames(statement)) {
          declare(id, statement);
          unexported.push(id);
        }
    }
  }
  if (implicitExports && !explicit) {
    for (const id of unexported) if (!scope.exports.has(id)) scope.exports.set(id, { local: id, type: false });
  }
  return scope;
}

/**
 * Whether an export of a JS or TS file is a runtime binding.
 * @param {Scope} scope
 * @param {Binding} binding
 */
function isRuntimeBinding(scope, binding) {
  if (binding.type) return false;
  if (!('local' in binding)) return true;
  const imported = scope.imports.get(binding.local);
  if (imported) return !imported.type;
  const declarations = scope.declarations.get(binding.local);
  return !declarations || !declarations.every(isTypeOnlyDeclaration);
}

// ---------------------------------------------------------------------------------------------
// A release

/** @type {{ found: Declaration | null, low: number }} */
const NOT_FOUND = Object.freeze({ found: null, low: Infinity });

/**
 * The published packages of one release, resolving specifiers across them.
 */
export class PublishedRelease {
  /** @type {Map<string, { names: Set<string>, unresolved: Set<string> }>} */
  #names = new Map();
  /** @type {Map<string, Declaration | null>} */
  #declarations = new Map();
  /**
   * The lookups in progress, each with its depth. A lookup that reaches one of these again (an
   * `export *` cycle) is not complete until that outer lookup is, so it is memoized only then.
   * @type {Map<string, number>}
   */
  #inProgress = new Map();

  /** @param {PublishedPackage[]} packages */
  constructor(packages) {
    /** @type {Map<string, PublishedPackage>} */
    this.packages = new Map(packages.map((pkg) => [pkg.name, pkg]));
    this.byLength = [...this.packages.keys()].sort((a, b) => b.length - a.length || compare(a, b));
  }

  /**
   * The package a bare specifier belongs to.
   * @param {string} specifier
   */
  packageFor(specifier) {
    const name = this.byLength.find((candidate) => specifier === candidate || specifier.startsWith(`${candidate}/`));
    return name ? /** @type {PublishedPackage} */ (this.packages.get(name)) : null;
  }

  /**
   * @param {Ref} from
   * @param {string} specifier
   * @param {'runtime' | 'types'} flavor
   * @returns {Ref | null}
   */
  resolve(from, specifier, flavor) {
    if (specifier.startsWith('.')) return from.pkg.resolveRelative(from, specifier, flavor);
    const pkg = this.packageFor(specifier);
    const entry = pkg?.layout.modules.get(specifier);
    if (pkg && entry) {
      if (flavor === 'runtime') return entry.runtime ? { pkg, file: entry.runtime, scope: null } : null;
      if (entry.types) return typesRef(pkg, specifier, entry.types);
    }
    if (flavor === 'runtime') return null;
    const owners = pkg
      ? [pkg, ...[...this.packages.values()].filter((other) => other !== pkg)]
      : this.packages.values();
    for (const owner of owners) {
      const ambient = owner.ambient.get(specifier);
      if (ambient) return { pkg: owner, file: ambient.file, scope: specifier };
    }
    return null;
  }

  /**
   * Every name a file exports, following `export *` (never `default`) wherever it resolves.
   * @param {Ref} ref
   * @param {'runtime' | 'types'} flavor
   * @returns {{ names: Set<string>, unresolved: Set<string> }}
   */
  namesOf(ref, flavor) {
    const { names, unresolved } = this.#namesOf(ref, flavor);
    return { names, unresolved };
  }

  /**
   * @param {Ref} ref
   * @param {'runtime' | 'types'} flavor
   * @returns {{ names: Set<string>, unresolved: Set<string>, low: number }}
   *   `low`: the depth of the outermost lookup in progress the result depends on
   */
  #namesOf(ref, flavor) {
    const key = `names\0${refKey(ref)}\0${flavor}`;
    const known = this.#names.get(key);
    if (known) return { ...known, low: Infinity };
    const pending = this.#inProgress.get(key);
    if (pending !== undefined) return { names: new Set(), unresolved: new Set(), low: pending };
    const depth = this.#inProgress.size;
    this.#inProgress.set(key, depth);
    const scope = ref.pkg.scope(ref);
    /** @type {Set<string>} */
    const names = new Set();
    /** @type {Set<string>} */
    const unresolved = new Set();
    let low = Infinity;
    for (const [name, binding] of scope.exports) {
      if (flavor === 'types' || isRuntimeBinding(scope, binding)) names.add(name);
    }
    for (const star of scope.stars) {
      if (flavor === 'runtime' && star.type) continue;
      const target = this.resolve(ref, star.from, flavor);
      if (!target) {
        unresolved.add(star.from);
        continue;
      }
      const inner = this.#namesOf(target, flavor);
      for (const name of inner.names) if (name !== 'default') names.add(name);
      for (const specifier of inner.unresolved) unresolved.add(specifier);
      low = Math.min(low, inner.low);
    }
    this.#inProgress.delete(key);
    if (low < depth) return { names, unresolved, low };
    this.#names.set(key, { names, unresolved });
    return { names, unresolved, low: Infinity };
  }

  /**
   * The declaration a type export resolves to, through re-exports, imports and `export *`.
   * @param {Ref} ref
   * @param {string} name
   * @returns {Declaration | null}
   */
  declarationOf(ref, name) {
    return this.#declarationOf(ref, name).found;
  }

  /**
   * @param {Ref} ref
   * @param {string} name
   * @returns {{ found: Declaration | null, low: number }}  `low` as for `#namesOf`
   */
  #declarationOf(ref, name) {
    const key = `declaration\0${refKey(ref)}\0${name}`;
    const known = this.#declarations.get(key);
    if (known !== undefined) return { found: known, low: Infinity };
    const pending = this.#inProgress.get(key);
    if (pending !== undefined) return { found: null, low: pending };
    const depth = this.#inProgress.size;
    this.#inProgress.set(key, depth);
    const { found, low } = this.#findDeclaration(ref, name);
    this.#inProgress.delete(key);
    if (!found && low < depth) return { found, low };
    this.#declarations.set(key, found);
    return { found, low: Infinity };
  }

  /**
   * @param {Ref} ref
   * @param {string} name
   * @returns {{ found: Declaration | null, low: number }}
   */
  #findDeclaration(ref, name) {
    const scope = ref.pkg.scope(ref);
    const binding = scope.exports.get(name);
    if (binding) {
      if ('namespace' in binding) return NOT_FOUND;
      if ('from' in binding) return this.#declarationIn(ref, binding.from, binding.imported);
      const imported = scope.imports.get(binding.local);
      if (imported?.imported === '*') return NOT_FOUND;
      if (imported) return this.#declarationIn(ref, imported.from, imported.imported);
      if (!scope.declarations.has(binding.local)) return NOT_FOUND;
      return { found: { ...ref, local: binding.local, viaDefault: name === 'default' }, low: Infinity };
    }
    if (name === 'default') return NOT_FOUND;
    let low = Infinity;
    for (const star of scope.stars) {
      const target = this.resolve(ref, star.from, 'types');
      if (!target) continue;
      const result = this.#declarationOf(target, name);
      if (result.found) return result;
      low = Math.min(low, result.low);
    }
    return { found: null, low };
  }

  /**
   * The declaration `name` of the module `specifier` names from `ref`.
   * @param {Ref} ref
   * @param {string} specifier
   * @param {string} name
   */
  #declarationIn(ref, specifier, name) {
    const target = this.resolve(ref, specifier, 'types');
    return target ? this.#declarationOf(target, name) : NOT_FOUND;
  }

  /**
   * The published side of one package, as `audits/<version>.json` records it.
   * @param {PublishedPackage} pkg
   * @returns {PublishedRecord}
   */
  describe(pkg) {
    const { layout } = pkg;
    /** @type {Record<string, ModuleRecord>} */
    const modules = {};
    for (const [module, entry] of layout.modules) {
      /** @type {Set<string>} */
      const unresolved = new Set();
      /** @param {Ref} ref @param {'runtime' | 'types'} flavor */
      const names = (ref, flavor) => {
        const result = this.namesOf(ref, flavor);
        for (const specifier of result.unresolved) unresolved.add(specifier);
        return sorted(result.names);
      };
      /** @type {ModuleRecord} */
      const record = {
        runtime: entry.runtime
          ? { file: entry.runtime, names: names({ pkg, file: entry.runtime, scope: null }, 'runtime') }
          : null,
        types: entry.types
          ? {
              file: entry.types.file,
              names: names(typesRef(pkg, module, entry.types), 'types'),
              ...(entry.types.ambient ? { ambient: /** @type {true} */ (true) } : {}),
            }
          : null,
      };
      if (unresolved.size) record.unresolved = sorted(unresolved);
      modules[module] = record;
    }
    /** @type {PublishedRecord} */
    const record = {
      version: pkg.version,
      published: true,
      modulesFrom: layout.modulesFrom,
      exports: pkg.manifest.exports ?? null,
      missing: layout.missing,
      chunks: layout.chunks,
      modules,
    };
    if (pkg.errors.size) record.parseErrors = sorted(pkg.errors.keys());
    return record;
  }

  /**
   * Every declaration a module's types export, by `<package>/<file in the package>#<local name>`
   * (`#default` for an anonymous default export), with its shape.
   * @returns {{ shapes: Map<string, string>, declarations: Map<string, Declaration> }}
   *   `declarations` maps `<module>\0<export>` to the declaration it resolves to
   */
  shapes() {
    /** @type {Map<string, string>} */
    const shapes = new Map();
    /** @type {Map<string, Declaration>} */
    const declarations = new Map();
    for (const name of sorted(this.packages.keys())) {
      const pkg = /** @type {PublishedPackage} */ (this.packages.get(name));
      for (const [module, entry] of pkg.layout.modules) {
        if (!entry.types) continue;
        const ref = typesRef(pkg, module, entry.types);
        for (const exported of sorted(this.namesOf(ref, 'types').names)) {
          const declaration = this.declarationOf(ref, exported);
          if (!declaration) continue;
          declarations.set(`${module}\0${exported}`, declaration);
          const id = declarationId(declaration);
          if (shapes.has(id)) continue;
          const shape = declaration.pkg.shape(declaration);
          if (shape) shapes.set(id, shape);
        }
      }
    }
    return { shapes, declarations };
  }
}

/**
 * @param {PublishedPackage} pkg
 * @param {string} module
 * @param {TypesTarget} types
 * @returns {Ref}
 */
function typesRef(pkg, module, types) {
  return { pkg, file: types.file, scope: types.ambient ? module : null };
}

/** @param {Ref} ref */
function refKey(ref) {
  return `${ref.pkg.name}\0${ref.file}\0${ref.scope ?? ''}`;
}

/**
 * `<package>/<file in the package>#<local name>`.
 * @param {Declaration} declaration
 */
export function declarationId(declaration) {
  return `${declaration.pkg.name}/${declaration.file}#${declaration.local}`;
}

// ---------------------------------------------------------------------------------------------
// Shapes

class Printer {
  /**
   * @param {string} source
   * @param {{ start: number, end: number }[]} comments
   */
  constructor(source, comments) {
    this.source = source;
    this.comments = comments;
  }

  /**
   * The source between two offsets without comments, whitespace collapsed.
   * @param {number} start
   * @param {number} end
   */
  text(start, end) {
    let low = 0;
    let high = this.comments.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (this.comments[middle].start < start) low = middle + 1;
      else high = middle;
    }
    let out = '';
    let position = start;
    for (let i = low; i < this.comments.length && this.comments[i].end <= end; i++) {
      out += this.source.slice(position, this.comments[i].start);
      position = this.comments[i].end;
    }
    out += this.source.slice(position, end);
    return out.replace(/\s+/g, ' ').trim();
  }

  /** @param {any} node */
  of(node) {
    return node ? this.text(node.start, node.end) : '';
  }
}

/**
 * @param {string} text
 * @param {number} [limit]
 */
function cap(text, limit = MAX_BODY) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * @param {Printer} printer
 * @param {any} fn  a function, a method's function value or a declared signature
 */
function signature(printer, fn) {
  const params = fn.params.map((/** @type {any} */ param) => printer.of(param)).join(', ');
  return `${printer.of(fn.typeParameters)}(${params})${printer.of(fn.returnType)}`;
}

/**
 * One class member on one line, as the declaration prints it (bodies and initializers dropped).
 * @param {Printer} printer
 * @param {any} member
 */
function memberLine(printer, member) {
  if (member.type === 'TSIndexSignature') return printer.of(member).replace(/;$/, '');
  /** @type {string[]} */
  const modifiers = [];
  if (member.accessibility) modifiers.push(member.accessibility);
  if (member.static) modifiers.push('static');
  if (member.type.startsWith('TSAbstract')) modifiers.push('abstract');
  if (member.override) modifiers.push('override');
  if (member.readonly) modifiers.push('readonly');
  if (/AccessorProperty$/.test(member.type)) modifiers.push('accessor');
  const key = member.computed ? `[${printer.of(member.key)}]` : printer.of(member.key);
  const optional = member.optional ? '?' : '';
  if (/MethodDefinition$/.test(member.type)) {
    const prefix = member.kind === 'get' ? 'get ' : member.kind === 'set' ? 'set ' : '';
    modifiers.push(`${prefix}${key}${optional}${signature(printer, member.value)}`);
  } else {
    modifiers.push(`${key}${optional}${printer.of(member.typeAnnotation)}`);
  }
  return cap(modifiers.join(' '));
}

/**
 * One declaration's shape: a class's heading and one line per member (at most
 * `MAX_CLASS_MEMBERS`), a function's full signature, a type's, interface's, enum's or
 * namespace's body (at most `MAX_BODY` characters), a variable's type.
 * @param {Printer} printer
 * @param {any} node
 * @param {string} name
 * @returns {string | null}
 */
function shapeOf(printer, node, name) {
  switch (node.type) {
    case 'ClassDeclaration': {
      const heritage = node.superClass
        ? ` extends ${printer.of(node.superClass)}${printer.of(node.superTypeArguments)}`
        : '';
      const implemented = node.implements?.length
        ? ` implements ${node.implements.map((/** @type {any} */ item) => printer.of(item)).join(', ')}`
        : '';
      const heading = `${node.abstract ? 'abstract ' : ''}class ${name}${printer.of(node.typeParameters)}${heritage}${implemented}`;
      const members = node.body.body.filter((/** @type {any} */ member) => member.type !== 'StaticBlock');
      const lines = members.slice(0, MAX_CLASS_MEMBERS).map((/** @type {any} */ member) => memberLine(printer, member));
      if (members.length > MAX_CLASS_MEMBERS) lines.push(`… ${members.length - MAX_CLASS_MEMBERS} more members`);
      return [heading, ...lines.map((line) => `  ${line}`)].join('\n');
    }
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      return `${node.async ? 'async ' : ''}function${node.generator ? '*' : ''} ${name}${signature(printer, node)}`;
    case 'TSInterfaceDeclaration': {
      const heritage = node.extends?.length
        ? ` extends ${node.extends.map((/** @type {any} */ item) => printer.of(item)).join(', ')}`
        : '';
      return `interface ${name}${printer.of(node.typeParameters)}${heritage} ${cap(printer.of(node.body))}`;
    }
    case 'TSTypeAliasDeclaration':
      return `type ${name}${printer.of(node.typeParameters)} = ${cap(printer.of(node.typeAnnotation))}`;
    case 'TSEnumDeclaration':
      return `${node.const ? 'const ' : ''}enum ${name} ${cap(printer.of(node.body))}`;
    case 'TSModuleDeclaration':
      return `namespace ${name} ${cap(printer.of(node.body))}`;
    case 'VariableDeclaration': {
      const declarator = node.declarations.find((/** @type {any} */ item) => patternNames(item.id).includes(name));
      if (!declarator) return null;
      const id = declarator.id.type === 'Identifier' ? printer.of(declarator.id) : name;
      return cap(`${node.kind} ${id}`);
    }
    default:
      return null;
  }
}
