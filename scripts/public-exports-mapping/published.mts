/**
 * The package as published on npm, from a cached tarball (area C of CONTRACT.md).
 *
 * - `packagesAt(version)` lists the non-private packages of a release tag (the working tree for
 *   `head`), each with the version its own `package.json` names at that tag.
 * - `fetchTarball(name, version)` runs `npm pack` once per name and version into a cache outside
 *   the repository and reports `unpublished` when the registry has no such version, which it
 *   also remembers in the cache.
 * - `readPublished(source)` describes one tarball (or an unpacked package directory): its
 *   `exports` map, the targets that do not ship, its modules, and per module the runtime export
 *   names (from the JS the `import`/`default` condition resolves to) and the type export names
 *   (from the `.d.ts` the `types` condition resolves to, the `.d.ts` beside the JS, a shipped
 *   `.ts` source, or an ambient `declare module` block), following `export *` and re-exports. A
 *   package that ships no `.d.ts` at all publishes no types: it is marked `types: "not
 *   published"` and none of its modules has type names.
 * - `PublishedRelease` ties the packages of one release together, so an `export * from` another
 *   package of the release resolves too, and prints declaration shapes from the `.d.ts` files.
 *
 * Module names derive from the package as published, code modules only:
 * - `exports`: every key with `./` dropped whose target (its runtime target, else its types
 *   target) is a `.js`, `.mjs`, `.cjs`, `.ts` or `.d.ts` file, except `blueprints/` and the
 *   `unstable-preview-types` entries; a pattern key expands against the files of the tarball its
 *   runtime target (else its types target) matches, keeping only the files Node resolves back to
 *   that key, skipping files that live under the target of a more specific condition of the same
 *   key (the `unpkg` builds) and files an explicit key already names;
 * - a v1 addon (`ember-addon.version` 1, as 4.12 and 5.0 publish): every `.js`/`.ts` under
 *   `addon/` as `<pkg>/<path>` and under `addon-test-support/` as `<pkg>/test-support/<path>`,
 *   `index` dropped;
 * - otherwise `main` (or `index.js`) as the package itself.
 * In the first two, a file whose name ends in a bundler content hash (`-cc461d33`, `-BwVo-2vv`)
 * is a shared build chunk rather than an entry: it is listed under `chunks`, not as a module.
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { parseSync } from 'oxc-parser';

import { REPO_ROOT } from './artifacts.mts';

const execFileAsync = promisify(execFile);

/** Members of a class shape beyond this many are summarized in one line. */
export const MAX_CLASS_MEMBERS = 40;
/** Characters of a type, interface, enum or namespace body (and of one class member) a shape keeps. */
export const MAX_BODY = 2000;

const MANIFEST = /^(?:packages|warp-drive-packages)\/[^/]+\/package\.json$/;
const CODE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
/** What a module's target is: JavaScript or TypeScript, `.d.ts` included. */
const CODE_MODULE = /\.[cm]?[jt]s$/;
const DTS = /\.d\.[cm]?ts$/;
const TYPES_FILE = /\.d\.[cm]?ts$|\.[cm]?tsx?$/;
const EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;

export interface PackageRef {
  name: string;
  dir: string;
  version: string;
}

export interface Tarball {
  name: string;
  version: string;
  status: 'cached' | 'fetched' | 'unpublished';
  path: string | null;
}

/**
 * Writes the tarball of `name@version` into `destination` and resolves to its path, or to `null`
 * when the registry has no such version.
 */
export type Pack = (request: { name: string; version: string; destination: string }) => Promise<string | null>;

export interface TypesTarget {
  file: string;
  ambient: boolean;
}

export interface ModuleTargets {
  runtime: string | null;
  types: TypesTarget | null;
}

/** exports key -> condition -> targets */
export type Missing = Record<string, Record<string, string[]>>;

export interface Layout {
  modulesFrom: 'exports' | 'addon' | 'main';
  missing: Missing;
  chunks: string[];
  modules: Map<string, ModuleTargets>;
}

/** A file of a package, or (`scope`) the `declare module '<scope>'` block inside it. */
export interface Ref {
  pkg: PublishedPackage;
  file: string;
  scope: string | null;
}

export interface LocalBinding {
  local: string;
  type: boolean;
}

export interface ReexportBinding {
  from: string;
  imported: string;
  type: boolean;
}

export interface NamespaceBinding {
  from: string;
  namespace: true;
  type: boolean;
}

export type Binding = LocalBinding | ReexportBinding | NamespaceBinding;

export interface Scope {
  exports: Map<string, Binding>;
  stars: { from: string; type: boolean }[];
  imports: Map<string, { from: string; imported: string; type: boolean }>;
  declarations: Map<string, any[]>;
}

export interface Declaration {
  pkg: PublishedPackage;
  file: string;
  scope: string | null;
  local: string;
  viaDefault: boolean;
}

export interface NamesRecord {
  file: string;
  names: string[];
  ambient?: true;
}

export interface ModuleRecord {
  runtime: NamesRecord | null;
  types: NamesRecord | null;
  unresolved?: string[];
}

export interface PublishedRecord {
  version: string;
  published: true;
  modulesFrom: Layout['modulesFrom'];
  exports: unknown;
  missing: Missing;
  chunks: string[];
  modules: Record<string, ModuleRecord>;
  parseErrors?: string[];
  types?: 'not published';
}

function compare(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort(compare);
}

function git(args: string[], cwd: string) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
}

// ---------------------------------------------------------------------------------------------
// Packages of a release

/**
 * The non-private packages of a release: every `packages/*` and `warp-drive-packages/*`
 * directory with a `package.json` at tag `v<version>` (the working tree for `head`), with the
 * version that `package.json` names, which is not always the repository's version.
 * @param version  a release version, or `head`
 */
export function packagesAt(version: string, { cwd = REPO_ROOT }: { cwd?: string } = {}): PackageRef[] {
  const manifests = version === 'head' ? workingTreeManifests(cwd) : tagManifests(`v${version}`, cwd);
  const found: Map<string, PackageRef> = new Map();
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

function tagManifests(tag: string, cwd: string) {
  return git(['ls-tree', '-r', '--name-only', tag, '--', 'packages', 'warp-drive-packages'], cwd)
    .split('\n')
    .filter((file) => MANIFEST.test(file))
    .map((file) => ({ file, json: git(['show', `${tag}:${file}`], cwd) }));
}

function workingTreeManifests(cwd: string) {
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
 */
export function defaultCacheDir(): string {
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
 */
export function tarballPath(cacheDir: string, name: string, version: string) {
  return path.join(cacheDir, name.replace('/', '+'), `${version}.tgz`);
}

/**
 * The file that records that the registry has no `name@version`: `<version>.unpublished` beside
 * where its tarball would be. Delete it to ask the registry again.
 */
export function unpublishedMarkerPath(cacheDir: string, name: string, version: string) {
  return path.join(cacheDir, name.replace('/', '+'), `${version}.unpublished`);
}

/**
 * The default `Pack`: `npm pack <name>@<version> --pack-destination <destination>`, run with the
 * destination (outside the repository, whose `devEngines` npm would enforce) as its cwd.
 */
export async function npmPack({ name, version, destination }: Parameters<Pack>[0]): ReturnType<Pack> {
  const spec = `${name}@${version}`;
  let stdout;
  try {
    ({ stdout } = await execFileAsync('npm', ['pack', spec, '--pack-destination', destination, '--json'], {
      cwd: destination,
      maxBuffer: 1 << 26,
    }));
  } catch (error) {
    const reply = parseJson((error as { stdout?: string }).stdout);
    const code = reply?.error?.code;
    if (code === 'E404' || code === 'ETARGET') return null;
    const detail = reply?.error?.summary ?? (error as Error).message;
    throw new Error(`npm pack ${spec} failed${code ? ` (${code})` : ''}: ${detail}`, { cause: error });
  }
  const reply = parseJson(stdout);
  const filename = Array.isArray(reply) ? reply[0]?.filename : undefined;
  if (typeof filename !== 'string') throw new Error(`npm pack ${spec} did not report the file it wrote`);
  return path.join(destination, filename);
}

function parseJson(text: string | undefined) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * The tarball of `name@version`, packed into the cache the first time and read from it after
 * that. A version the registry does not have is `unpublished`, not an error, and is remembered by
 * a marker file in the cache, so a later run asks the registry nothing.
 */
export async function fetchTarball(
  name: string,
  version: string,
  { cacheDir = defaultCacheDir(), pack = npmPack }: { cacheDir?: string; pack?: Pack } = {}
): Promise<Tarball> {
  const file = tarballPath(cacheDir, name, version);
  if (existsSync(file)) return { name, version, status: 'cached', path: file };
  const marker = unpublishedMarkerPath(cacheDir, name, version);
  if (existsSync(marker)) return { name, version, status: 'unpublished', path: null };
  mkdirSync(path.dirname(file), { recursive: true });
  const packed = await pack({ name, version, destination: path.dirname(file) });
  if (packed === null) {
    writeFileSync(marker, `the registry has no ${name}@${version}; delete this file to ask again\n`);
    return { name, version, status: 'unpublished', path: null };
  }
  if (path.resolve(packed) !== file) renameSync(packed, file);
  return { name, version, status: 'fetched', path: file };
}

// ---------------------------------------------------------------------------------------------
// Reading a tarball

/**
 * Reads a gzipped tar (an npm tarball) into memory: path inside the package, with the leading
 * `package/` directory dropped, to its bytes. Handles ustar prefixes, pax and GNU long names.
 */
export function readTarball(file: string): Map<string, Buffer> {
  const data = gunzipSync(readFileSync(file));
  const files: Map<string, Buffer> = new Map();
  let longName: string | null = null;
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

function cString(bytes: Buffer) {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end === -1 ? bytes.length : end).toString('utf8');
}

function octal(bytes: Buffer) {
  if (bytes[0] & 0x80) {
    let value = 0;
    for (let i = 1; i < bytes.length; i++) value = value * 256 + bytes[i];
    return value;
  }
  return parseInt(cString(bytes).trim() || '0', 8);
}

function headerName(header: Buffer) {
  const name = cString(header.subarray(0, 100));
  const ustar = header.subarray(257, 263).toString('latin1') === 'ustar\0';
  const prefix = ustar ? cString(header.subarray(345, 500)) : '';
  return prefix ? `${prefix}/${name}` : name;
}

/**
 * The `path` record of a pax extended header (`<length> <key>=<value>\n`, length in bytes).
 */
function paxPath(body: Buffer): string | null {
  let found: string | null = null;
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

function readDirectory(root: string): Map<string, Buffer> {
  const files: Map<string, Buffer> = new Map();
  const walk = (dir: string) => {
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
 */
export function openPublished(source: string): PublishedPackage {
  return new PublishedPackage(statSync(source).isDirectory() ? readDirectory(source) : readTarball(source));
}

/**
 * Describes one published package on its own: re-exports from other packages stay unresolved
 * (listed per module under `unresolved`); `auditOf` resolves them across the whole release.
 * @param source  a `.tgz`, or an unpacked package directory
 */
export function readPublished(source: string): PublishedRecord {
  const pkg = openPublished(source);
  return new PublishedRelease([pkg]).describe(pkg);
}

// ---------------------------------------------------------------------------------------------
// One package

/**
 * A shared build chunk rather than an entry: the file name ends in `-` and an eight character
 * content hash with a digit or capital in it (`index-cc461d33.js`, `many-array-BwVo-2vv.js`).
 */
export function isChunk(file: string) {
  const stem = path.posix.basename(file).replace(EXTENSION, '');
  const match = /-([\w-]{8})$/.exec(stem);
  return match !== null && match.index > 0 && /[0-9A-Z]/.test(match[1]);
}

export class PublishedPackage {
  #parsed: Map<string, { source: string; program: any; comments: any[]; isModule: boolean }> = new Map();
  #scopes: Map<string, Scope> = new Map();
  #ambient: Map<string, { file: string; node: any }> | null = null;
  #layout: Layout | null = null;
  #publishesTypes: boolean | null = null;

  files: Map<string, Buffer>;
  manifest: any;
  name: string;
  version: string;
  /** file -> parse errors */
  errors: Map<string, string[]>;

  /** @param files  path inside the package -> bytes */
  constructor(files: Map<string, Buffer>) {
    const manifest = files.get('package.json');
    if (!manifest) throw new Error('the package has no package.json');
    this.files = files;
    this.manifest = JSON.parse(manifest.toString('utf8'));
    this.name = this.manifest.name;
    this.version = this.manifest.version;
    this.errors = new Map();
  }

  has(file: string) {
    return this.files.has(file);
  }

  parse(file: string) {
    let parsed = this.#parsed.get(file);
    if (!parsed) {
      const source = (this.files.get(file) as Buffer).toString('utf8');
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
   */
  get ambient(): Map<string, { file: string; node: any }> {
    if (!this.#ambient) {
      this.#ambient = new Map();
      for (const file of sorted(this.files.keys())) {
        if (!DTS.test(file)) continue;
        const text = (this.files.get(file) as Buffer).toString('utf8');
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

  /** Whether the package ships any `.d.ts`; without one it publishes no types. */
  get publishesTypes() {
    this.#publishesTypes ??= [...this.files.keys()].some((file) => DTS.test(file));
    return this.#publishesTypes;
  }

  get layout(): Layout {
    if (!this.#layout) {
      const layout = layoutOf(this);
      if (!this.publishesTypes) for (const entry of layout.modules.values()) entry.types = null;
      this.#layout = layout;
    }
    return this.#layout;
  }

  /**
   * What a file (or an ambient module block in it) declares, imports and exports.
   */
  scope(ref: Ref): Scope {
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
   */
  resolveRelative(ref: Ref, specifier: string, flavor: 'runtime' | 'types'): Ref | null {
    if (ref.scope !== null) return null;
    const base = path.posix.join(path.posix.dirname(ref.file), specifier);
    const candidates = flavor === 'types' ? typesCandidates(base) : runtimeCandidates(base);
    const file = candidates.find((candidate) => this.has(candidate));
    return file ? { pkg: this, file, scope: null } : null;
  }

  /**
   * The declaration's shape as its file prints it.
   */
  shape(declaration: Declaration) {
    const nodes = this.scope(declaration).declarations.get(declaration.local) ?? [];
    const { source, comments } = this.parse(declaration.file);
    const printer = new Printer(source, comments);
    return nodes
      .map((node) => shapeOf(printer, node, declaration.local))
      .filter(Boolean)
      .join('\n');
  }
}

function langOf(file: string) {
  if (DTS.test(file)) return 'dts';
  if (/\.tsx$/.test(file)) return 'tsx';
  if (/\.[cm]?ts$/.test(file)) return 'ts';
  if (/\.jsx$/.test(file)) return 'jsx';
  return 'js';
}

function runtimeCandidates(base: string) {
  return [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.ts`, `${base}/index.js`, `${base}/index.ts`];
}

function typesCandidates(base: string) {
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
 */
function siblingTypes(file: string): string | null {
  const js = /\.([cm]?)js$/.exec(file);
  return js ? `${file.slice(0, -js[0].length)}.d.${js[1]}ts` : null;
}

function clean(target: string) {
  return target.replace(/^\.\//, '');
}

// ---------------------------------------------------------------------------------------------
// Module list

function layoutOf(pkg: PublishedPackage): Layout {
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

function isSource(file: string) {
  return CODE_MODULE.test(file) && !DTS.test(file);
}

/**
 * `exports` as a subpath map: a string, an array or a conditions object is the `.` entry.
 */
function subpathMap(field: unknown): Record<string, unknown> {
  if (typeof field !== 'object' || field === null || Array.isArray(field)) return { '.': field };
  const keys = Object.keys(field);
  if (keys.length && keys.every((key) => !key.startsWith('.'))) return { '.': field };
  return field as Record<string, unknown>;
}

/**
 * Every string target of an `exports` entry with the conditions leading to it.
 */
function leavesOf(target: unknown, conditions: string[] = []): { conditions: string[]; target: string }[] {
  if (typeof target === 'string') return [{ conditions, target }];
  if (Array.isArray(target)) return target.flatMap((item) => leavesOf(item, conditions));
  if (target && typeof target === 'object') {
    return Object.entries(target).flatMap(([condition, item]) => leavesOf(item, [...conditions, condition]));
  }
  return [];
}

function conditionName(conditions: string[]) {
  return conditions.length ? conditions.join('.') : 'default';
}

/**
 * Node's condition matching: the first key in object order that is `default` or one of
 * `conditions` and itself resolves. `undefined` when nothing matches, `null` when excluded.
 */
function pickTarget(target: unknown, conditions: string[]): string | null | undefined {
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
    for (const [condition, item] of Object.entries(target as object)) {
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
 */
function runtimeTarget(target: unknown) {
  const picked = pickTarget(target, ['import']);
  return picked === undefined ? pickTarget(target, ['node', 'require']) : picked;
}

function typesTarget(target: unknown) {
  return pickTarget(target, ['types', 'import']);
}

/**
 * Node's PATTERN_KEY_COMPARE: negative when `a` is the more specific key.
 */
function patternKeyCompare(a: string, b: string) {
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
 */
function matchKey(map: Record<string, unknown>, subpath: string): { key: string; star: string | null } | null {
  if (!subpath.includes('*') && Object.hasOwn(map, subpath)) return { key: subpath, star: null };
  let best: { key: string; star: string } | null = null;
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
 */
function matchTarget(pattern: string, file: string) {
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

function staticPrefix(pattern: string) {
  const target = clean(pattern);
  return target.slice(0, target.indexOf('*'));
}

/**
 * @param subpath  `.` or `./<path>`
 */
function moduleName(pkgName: string, subpath: string) {
  return subpath === '.' ? pkgName : `${pkgName}${subpath.slice(1)}`;
}

function exportsLayout(pkg: PublishedPackage, map: Record<string, unknown>): Omit<Layout, 'modulesFrom'> {
  const files = sorted(pkg.files.keys());
  const missing: Record<string, Record<string, Set<string>>> = {};
  const addMissing = (key: string, conditions: string[], target: string) => {
    ((missing[key] ??= {})[conditionName(conditions)] ??= new Set()).add(target);
  };
  const chunks: Set<string> = new Set();
  const candidates: { module: string; key: string; star: string | null }[] = [];
  const explicitFiles: Set<string> = new Set();
  /** pattern key -> conditions whose pattern matches no file */
  const emptyPatterns: Map<string, Set<string>> = new Map();

  for (const [key, target] of Object.entries(map)) {
    if (key.includes('*')) continue;
    for (const leaf of leavesOf(target)) {
      if (!leaf.target.endsWith('/') && !pkg.has(clean(leaf.target))) addMissing(key, leaf.conditions, leaf.target);
    }
    const runtime = runtimeTarget(target);
    if (typeof runtime === 'string') explicitFiles.add(clean(runtime));
    const resolved = typeof runtime === 'string' ? runtime : typesTarget(target);
    if (isCodeModule(key, resolved)) candidates.push({ module: moduleName(pkg.name, key), key, star: null });
  }

  for (const [key, target] of Object.entries(map)) {
    if (!key.includes('*')) continue;
    const leaves = leavesOf(target).filter((leaf) => leaf.target.includes('*'));
    const empty = new Set<string>();
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
      if (matchKey(map, subpath)?.key !== key || !isCodeModule(subpath, file)) continue;
      if (isChunk(file)) chunks.add(file);
      else if (!explicitFiles.has(file)) candidates.push({ module: moduleName(pkg.name, subpath), key, star });
    }
  }

  const modules: Map<string, ModuleTargets> = new Map();
  for (const { module, key, star } of candidates) {
    if (modules.has(module)) continue;
    const target = map[key];
    const resolve = (value: string) => clean(star === null ? value : value.replaceAll('*', star));
    if (star !== null) {
      for (const leaf of leavesOf(target)) {
        if (!leaf.target.includes('*') || emptyPatterns.get(key)?.has(conditionName(leaf.conditions))) continue;
        if (!pkg.has(resolve(leaf.target))) addMissing(key, leaf.conditions, `./${resolve(leaf.target)}`);
      }
    }
    const runtime = runtimeTarget(target);
    const runtimeFile = typeof runtime === 'string' && pkg.has(resolve(runtime)) ? resolve(runtime) : null;
    const types = typesTarget(target);
    const typesFile: TypesTarget | null =
      typeof types === 'string' && TYPES_FILE.test(types)
        ? pkg.has(resolve(types))
          ? { file: resolve(types), ambient: false }
          : null
        : siblingOrAmbient(pkg, module, runtimeFile);
    modules.set(module, { runtime: runtimeFile, types: typesFile });
  }

  const frozen: Missing = {};
  for (const [key, byCondition] of Object.entries(missing)) {
    frozen[key] = {};
    for (const [condition, targets] of Object.entries(byCondition)) frozen[key][condition] = sorted(targets);
  }
  return { missing: frozen, chunks: sorted(chunks), modules: sortedMap(modules) };
}

/**
 * Whether an `exports` subpath resolving to `target` is a code module: the target is a `.js`,
 * `.mjs`, `.cjs`, `.ts` or `.d.ts` file (so `package.json`, Markdown and JSON are not), outside
 * `blueprints/`, and the subpath is not one of the `unstable-preview-types` entries.
 * @param subpath  `.` or `./<path>`
 */
function isCodeModule(subpath: string, target: unknown) {
  if (typeof target !== 'string' || !CODE_MODULE.test(target)) return false;
  const file = clean(target);
  if (subpath.startsWith('./blueprints/') || file.startsWith('blueprints/')) return false;
  return ![...subpath.split('/'), ...file.split('/')].includes('unstable-preview-types');
}

/**
 * Types for a module with no `types` condition: a TypeScript source is its own types, else the
 * `.d.ts` beside its JS, else an ambient `declare module` of the module's name.
 */
function siblingOrAmbient(pkg: PublishedPackage, module: string, runtimeFile: string | null): TypesTarget | null {
  if (runtimeFile && TYPES_FILE.test(runtimeFile)) return { file: runtimeFile, ambient: false };
  const sibling = runtimeFile ? siblingTypes(runtimeFile) : null;
  if (sibling && pkg.has(sibling)) return { file: sibling, ambient: false };
  const ambient = pkg.ambient.get(module);
  return ambient ? { file: ambient.file, ambient: true } : null;
}

function addonLayout(pkg: PublishedPackage): { chunks: string[]; modules: Map<string, ModuleTargets> } {
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
  const chunks: Set<string> = new Set();
  const modules: Map<string, ModuleTargets> = new Map();
  for (const { file, module } of entries) {
    if (isChunk(file)) chunks.add(file);
    else if (!modules.has(module)) modules.set(module, { runtime: file, types: siblingOrAmbient(pkg, module, file) });
  }
  return { chunks: sorted(chunks), modules };
}

function mainLayout(pkg: PublishedPackage): Map<string, ModuleTargets> {
  const main = typeof pkg.manifest.main === 'string' ? clean(pkg.manifest.main) : 'index.js';
  const runtime = runtimeCandidates(main).find((file) => pkg.has(file)) ?? null;
  const declared = pkg.manifest.types ?? pkg.manifest.typings;
  const declaredFile =
    typeof declared === 'string' ? typesCandidates(clean(declared)).find((file) => pkg.has(file)) : undefined;
  const types = declaredFile ? { file: declaredFile, ambient: false } : siblingOrAmbient(pkg, pkg.name, runtime);
  return runtime || types ? new Map([[pkg.name, { runtime, types }]]) : new Map();
}

function sortedMap<T>(map: Map<string, T>): Map<string, T> {
  return new Map([...map].sort(([a], [b]) => compare(a, b)));
}

// ---------------------------------------------------------------------------------------------
// What a file exports

function emptyScope(): Scope {
  return { exports: new Map(), stars: [], imports: new Map(), declarations: new Map() };
}

function nameOf(node: any) {
  return node.type === 'Literal' ? String(node.value) : node.name;
}

function patternNames(pattern: any): string[] {
  if (!pattern) return [];
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name];
    case 'ObjectPattern':
      return pattern.properties.flatMap((property: any) =>
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
 */
function declaredNames(node: any): string[] {
  switch (node.type) {
    case 'VariableDeclaration':
      return node.declarations.flatMap((declarator: any) => patternNames(declarator.id));
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
 */
function isTypeOnlyDeclaration(node: any) {
  if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration') return true;
  if (node.type === 'TSEnumDeclaration' && node.const) return true;
  return Boolean(node.declare);
}

/**
 * Exports, star re-exports, imports and declarations of a statement list: a module's body or an
 * ambient module block. In an ambient context without any `export {}`, `export *`, `export =` or
 * `export default <expression>`, every declaration is exported, as TypeScript treats it.
 */
function scopeOf(statements: any[], { implicitExports }: { implicitExports: boolean }): Scope {
  const scope = emptyScope();
  const declare = (id: string, node: any) => {
    const list = scope.declarations.get(id);
    if (list) list.push(node);
    else scope.declarations.set(id, [node]);
  };
  let explicit = false;
  const unexported: string[] = [];
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
 */
function isRuntimeBinding(scope: Scope, binding: Binding) {
  if (binding.type) return false;
  if (!('local' in binding)) return true;
  const imported = scope.imports.get(binding.local);
  if (imported) return !imported.type;
  const declarations = scope.declarations.get(binding.local);
  return !declarations || !declarations.every(isTypeOnlyDeclaration);
}

// ---------------------------------------------------------------------------------------------
// A release

const NOT_FOUND: { found: Declaration | null; low: number } = Object.freeze({ found: null, low: Infinity });

/**
 * The published packages of one release, resolving specifiers across them.
 */
export class PublishedRelease {
  #names: Map<string, { names: Set<string>; unresolved: Set<string> }> = new Map();
  #declarations: Map<string, Declaration | null> = new Map();
  /**
   * The lookups in progress, each with its depth. A lookup that reaches one of these again (an
   * `export *` cycle) is not complete until that outer lookup is, so it is memoized only then.
   */
  #inProgress: Map<string, number> = new Map();

  packages: Map<string, PublishedPackage>;
  byLength: string[];

  constructor(packages: PublishedPackage[]) {
    this.packages = new Map(packages.map((pkg) => [pkg.name, pkg]));
    this.byLength = [...this.packages.keys()].sort((a, b) => b.length - a.length || compare(a, b));
  }

  /**
   * The package a bare specifier belongs to.
   */
  packageFor(specifier: string) {
    const name = this.byLength.find((candidate) => specifier === candidate || specifier.startsWith(`${candidate}/`));
    return name ? (this.packages.get(name) as PublishedPackage) : null;
  }

  resolve(from: Ref, specifier: string, flavor: 'runtime' | 'types'): Ref | null {
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
   */
  namesOf(ref: Ref, flavor: 'runtime' | 'types'): { names: Set<string>; unresolved: Set<string> } {
    const { names, unresolved } = this.#namesOf(ref, flavor);
    return { names, unresolved };
  }

  /**
   * @returns `low`: the depth of the outermost lookup in progress the result depends on
   */
  #namesOf(ref: Ref, flavor: 'runtime' | 'types'): { names: Set<string>; unresolved: Set<string>; low: number } {
    const key = `names\0${refKey(ref)}\0${flavor}`;
    const known = this.#names.get(key);
    if (known) return { ...known, low: Infinity };
    const pending = this.#inProgress.get(key);
    if (pending !== undefined) return { names: new Set(), unresolved: new Set(), low: pending };
    const depth = this.#inProgress.size;
    this.#inProgress.set(key, depth);
    const scope = ref.pkg.scope(ref);
    const names: Set<string> = new Set();
    const unresolved: Set<string> = new Set();
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
   */
  declarationOf(ref: Ref, name: string): Declaration | null {
    return this.#declarationOf(ref, name).found;
  }

  /**
   * @returns `low` as for `#namesOf`
   */
  #declarationOf(ref: Ref, name: string): { found: Declaration | null; low: number } {
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

  #findDeclaration(ref: Ref, name: string): { found: Declaration | null; low: number } {
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
   */
  #declarationIn(ref: Ref, specifier: string, name: string): { found: Declaration | null; low: number } {
    const target = this.resolve(ref, specifier, 'types');
    return target ? this.#declarationOf(target, name) : NOT_FOUND;
  }

  /**
   * The published side of one package, as `audits/<version>.json` records it.
   */
  describe(pkg: PublishedPackage): PublishedRecord {
    const { layout } = pkg;
    const modules: Record<string, ModuleRecord> = {};
    for (const [module, entry] of layout.modules) {
      const unresolved: Set<string> = new Set();
      const names = (ref: Ref, flavor: 'runtime' | 'types') => {
        const result = this.namesOf(ref, flavor);
        for (const specifier of result.unresolved) unresolved.add(specifier);
        return sorted(result.names);
      };
      const record: ModuleRecord = {
        runtime: entry.runtime
          ? { file: entry.runtime, names: names({ pkg, file: entry.runtime, scope: null }, 'runtime') }
          : null,
        types: entry.types
          ? {
              file: entry.types.file,
              names: names(typesRef(pkg, module, entry.types), 'types'),
              ...(entry.types.ambient ? { ambient: true as const } : {}),
            }
          : null,
      };
      if (unresolved.size) record.unresolved = sorted(unresolved);
      modules[module] = record;
    }
    const record: PublishedRecord = {
      version: pkg.version,
      published: true,
      modulesFrom: layout.modulesFrom,
      exports: pkg.manifest.exports ?? null,
      missing: layout.missing,
      chunks: layout.chunks,
      modules,
    };
    if (pkg.errors.size) record.parseErrors = sorted(pkg.errors.keys());
    if (!pkg.publishesTypes) record.types = 'not published';
    return record;
  }

  /**
   * Every declaration a module's types export, by `<package>/<file in the package>#<local name>`
   * (`#default` for an anonymous default export), with its shape.
   * @returns `declarations` maps `<module>\0<export>` to the declaration it resolves to
   */
  shapes(): { shapes: Map<string, string>; declarations: Map<string, Declaration> } {
    const shapes: Map<string, string> = new Map();
    const declarations: Map<string, Declaration> = new Map();
    for (const name of sorted(this.packages.keys())) {
      const pkg = this.packages.get(name) as PublishedPackage;
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

function typesRef(pkg: PublishedPackage, module: string, types: TypesTarget): Ref {
  return { pkg, file: types.file, scope: types.ambient ? module : null };
}

function refKey(ref: Ref) {
  return `${ref.pkg.name}\0${ref.file}\0${ref.scope ?? ''}`;
}

/**
 * `<package>/<file in the package>#<local name>`.
 */
export function declarationId(declaration: Declaration) {
  return `${declaration.pkg.name}/${declaration.file}#${declaration.local}`;
}

// ---------------------------------------------------------------------------------------------
// Shapes

class Printer {
  source: string;
  comments: { start: number; end: number }[];

  constructor(source: string, comments: { start: number; end: number }[]) {
    this.source = source;
    this.comments = comments;
  }

  /**
   * The source between two offsets without comments, whitespace collapsed.
   */
  text(start: number, end: number) {
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

  of(node: any) {
    return node ? this.text(node.start, node.end) : '';
  }
}

function cap(text: string, limit = MAX_BODY) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * @param fn  a function, a method's function value or a declared signature
 */
function signature(printer: Printer, fn: any) {
  const params = fn.params.map((param: any) => printer.of(param)).join(', ');
  return `${printer.of(fn.typeParameters)}(${params})${printer.of(fn.returnType)}`;
}

/**
 * One class member on one line, as the declaration prints it (bodies and initializers dropped).
 */
function memberLine(printer: Printer, member: any) {
  if (member.type === 'TSIndexSignature') return printer.of(member).replace(/;$/, '');
  const modifiers: string[] = [];
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
 */
function shapeOf(printer: Printer, node: any, name: string): string | null {
  switch (node.type) {
    case 'ClassDeclaration': {
      const heritage = node.superClass
        ? ` extends ${printer.of(node.superClass)}${printer.of(node.superTypeArguments)}`
        : '';
      const implemented = node.implements?.length
        ? ` implements ${node.implements.map((item: any) => printer.of(item)).join(', ')}`
        : '';
      const heading = `${node.abstract ? 'abstract ' : ''}class ${name}${printer.of(node.typeParameters)}${heritage}${implemented}`;
      const members = node.body.body.filter((member: any) => member.type !== 'StaticBlock');
      const lines: string[] = members.slice(0, MAX_CLASS_MEMBERS).map((member: any) => memberLine(printer, member));
      if (members.length > MAX_CLASS_MEMBERS) lines.push(`… ${members.length - MAX_CLASS_MEMBERS} more members`);
      return [heading, ...lines.map((line) => `  ${line}`)].join('\n');
    }
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      return `${node.async ? 'async ' : ''}function${node.generator ? '*' : ''} ${name}${signature(printer, node)}`;
    case 'TSInterfaceDeclaration': {
      const heritage = node.extends?.length
        ? ` extends ${node.extends.map((item: any) => printer.of(item)).join(', ')}`
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
      const declarator = node.declarations.find((item: any) => patternNames(item.id).includes(name));
      if (!declarator) return null;
      const id = declarator.id.type === 'Identifier' ? printer.of(declarator.id) : name;
      return cap(`${node.kind} ${id}`);
    }
    default:
      return null;
  }
}
