/**
 * Surface vs published package (area C of CONTRACT.md): `audits/<version>.json` and
 * `shapes/<version>.json`.
 *
 * The audit records, per non-private package of a release, what npm has at the version the tag's
 * `package.json` names (see `published.mjs`) and, when `surfaces/<version>.json` exists, how the
 * surface disagrees with it, per package the surface covers:
 *
 * - `modulesNotShipped`: modules of the surface the package does not ship;
 * - `modulesNotInSurface`: modules the package ships that the surface lacks (all their tokens);
 * - `tokensNotShipped`: per module both have, exports of the surface the package lacks;
 * - `tokensNotInSurface`: per module both have, exports of the package the surface lacks;
 * - `kinds`: per module both have, exports whose `kind` disagrees (`value` when the published JS
 *   has the binding, `type` when only the published types have it).
 *
 * A package that publishes no types (`types: "not published"`, as every package of 4.12 and 5.0)
 * is compared on its values only: the surface's `type` exports, and its modules that export
 * nothing else, are not expected to ship. A package the surface does not cover is listed under
 * `packagesNotInSurface` and not compared.
 *
 * The shapes map each declaration the published types export to its shape, by
 * `<package>/<file in the package>#<local name>` and, when a surface is given, also by the
 * surface's source declaration id when the local names match.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import { DATA_ROOT, readJson, REPO_ROOT } from './artifacts.mjs';
import { declarationId, fetchTarball, openPublished, packagesAt, PublishedRelease } from './published.mjs';

/**
 * @typedef {import('./published.mjs').PackageRef} PackageRef
 * @typedef {import('./published.mjs').Pack} Pack
 * @typedef {import('./published.mjs').Tarball} Tarball
 * @typedef {import('./published.mjs').ModuleRecord} ModuleRecord
 * @typedef {import('./published.mjs').PublishedRecord} PublishedRecord
 * @typedef {import('./published.mjs').Declaration} Declaration
 * @typedef {{ kind: 'value' | 'type', decl: string, deprecated?: boolean }} SurfaceExport
 * @typedef {{ package: string, entry?: string, forward?: string | null, exports: Record<string, SurfaceExport> }} SurfaceModule
 * @typedef {{
 *   schema: 1, kind: 'surface', version: string, tag: string | null,
 *   packages: Record<string, { dir: string, modules: string[] }>,
 *   modules: Record<string, SurfaceModule>,
 * }} Surface
 * @typedef {{
 *   modulesNotShipped: string[],
 *   modulesNotInSurface: string[],
 *   tokensNotShipped: Record<string, string[]>,
 *   tokensNotInSurface: Record<string, string[]>,
 *   kinds: Record<string, Record<string, { published: 'value' | 'type', surface: 'value' | 'type' }>>,
 * }} Differences
 * @typedef {({ dir: string } & PublishedRecord) | { dir: string, version: string, published: false }} PackageAudit
 * @typedef {PackageAudit & { differences?: Differences }} PackageEntry
 * @typedef {{
 *   schema: 1, kind: 'audit', version: string, tag: string | null, surface: string | null,
 *   packages: Record<string, PackageEntry>, packagesNotInSurface?: string[],
 *   surfacePackagesNotInRelease?: string[],
 * }} Audit
 * @typedef {{ schema: 1, kind: 'shapes', version: string, tag: string | null, shapes: Record<string, string> }} Shapes
 * @typedef {{
 *   surface?: Surface | null,
 *   surfaceFile?: string,
 *   packages?: PackageRef[],
 *   cacheDir?: string,
 *   pack?: Pack,
 *   concurrency?: number,
 * }} AuditOptions
 */

/** @param {string} a @param {string} b */
function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {string} version
 * @param {string} [dataRoot]
 */
export function surfacePath(version, dataRoot = DATA_ROOT) {
  return path.join(dataRoot, 'surfaces', `${version}.json`);
}

/**
 * `surfaces/<version>.json`, or `null` while area A has not written it.
 * @param {string} version
 * @param {{ dataRoot?: string }} [options]
 * @returns {Surface | null}
 */
export function loadSurface(version, { dataRoot = DATA_ROOT } = {}) {
  const file = surfacePath(version, dataRoot);
  return existsSync(file) ? readJson(file) : null;
}

/**
 * The audit and the shapes of one release, and the tarballs read for it.
 * @param {string} version  a release version, or `head`
 * @param {AuditOptions} [options]
 * @returns {Promise<{ audit: Audit, shapes: Shapes, tarballs: Tarball[] }>}
 */
export async function auditRelease(version, options = {}) {
  const { surface = null, cacheDir, pack, concurrency = 6 } = options;
  const packages = options.packages ?? packagesAt(version);
  const tarballs = await mapLimit(packages, concurrency, (ref) =>
    fetchTarball(ref.name, ref.version, { cacheDir, pack })
  );

  /** @type {Map<string, import('./published.mjs').PublishedPackage>} */
  const opened = new Map();
  for (const [index, ref] of packages.entries()) {
    const file = tarballs[index].path;
    if (!file) continue;
    const pkg = openPublished(file);
    if (pkg.name !== ref.name || pkg.version !== ref.version) {
      throw new Error(`${file} holds ${pkg.name}@${pkg.version}, expected ${ref.name}@${ref.version}`);
    }
    opened.set(ref.name, pkg);
  }
  const release = new PublishedRelease([...opened.values()]);

  /** @type {Record<string, PackageEntry>} */
  const records = {};
  for (const ref of packages) {
    const pkg = opened.get(ref.name);
    records[ref.name] = pkg
      ? { dir: ref.dir, ...release.describe(pkg) }
      : { dir: ref.dir, version: ref.version, published: false };
  }

  const tag = version === 'head' ? null : `v${version}`;
  /** @type {Audit} */
  const audit = { schema: 1, kind: 'audit', version, tag, surface: null, packages: records };
  if (surface) {
    const file = options.surfaceFile ?? surfacePath(version);
    audit.surface = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    const { differences, surfaceOnly, notInSurface } = compareWithSurface(records, surface);
    for (const [name, entry] of Object.entries(differences)) records[name].differences = entry;
    audit.packagesNotInSurface = notInSurface;
    audit.surfacePackagesNotInRelease = surfaceOnly;
  }

  const { shapes, declarations } = release.shapes();
  /** @type {Map<string, string>} */
  const all = new Map(shapes);
  if (surface) {
    for (const [id, shape] of sourceShapes(surface, shapes, declarations)) if (!all.has(id)) all.set(id, shape);
  }
  /** @type {Shapes} */
  const shapesFile = { schema: 1, kind: 'shapes', version, tag, shapes: Object.fromEntries(all) };
  return { audit, shapes: shapesFile, tarballs };
}

/**
 * `audits/<version>.json`: the published side of every package of the release and, when a surface
 * is given, its differences against the surface.
 * @param {string} version
 * @param {AuditOptions} [options]
 * @returns {Promise<Audit>}
 */
export async function auditOf(version, options = {}) {
  return (await auditRelease(version, options)).audit;
}

/**
 * The kind a published module gives each of its names: `value` when its JS exports the name,
 * else `type`.
 * @param {ModuleRecord} record
 * @returns {Map<string, 'value' | 'type'>}
 */
export function publishedKinds(record) {
  /** @type {Map<string, 'value' | 'type'>} */
  const kinds = new Map();
  for (const name of record.types?.names ?? []) kinds.set(name, 'type');
  for (const name of record.runtime?.names ?? []) kinds.set(name, 'value');
  return kinds;
}

/**
 * The differences between the published packages and a surface, per package the surface covers.
 * @param {Record<string, PackageAudit>} packages
 * @param {Surface} surface
 * @returns {{ differences: Record<string, Differences>, surfaceOnly: string[], notInSurface: string[] }}
 *   `surfaceOnly`: packages of the surface the release does not have; `notInSurface`: packages of
 *   the release the surface does not cover
 */
export function compareWithSurface(packages, surface) {
  /** @type {Map<string, string[]>} */
  const byPackage = new Map();
  for (const [module, entry] of Object.entries(surface.modules)) {
    const list = byPackage.get(entry.package);
    if (list) list.push(module);
    else byPackage.set(entry.package, [module]);
  }
  const covered = new Set([...Object.keys(surface.packages ?? {}), ...byPackage.keys()]);
  /** @type {Record<string, Differences>} */
  const differences = {};
  /** @type {string[]} */
  const uncovered = [];
  for (const [name, record] of Object.entries(packages)) {
    if (!covered.has(name)) {
      uncovered.push(name);
      continue;
    }
    // without published types only values can be checked: a type export, or a module that exports
    // types and nothing else, is not expected to ship
    const valuesOnly = record.published && record.types === 'not published';
    /** @param {SurfaceExport} entry */
    const expected = (entry) => !valuesOnly || entry.kind === 'value';
    /** @param {string} module */
    const expectedModule = (module) => {
      const exports = Object.values(surface.modules[module].exports);
      return exports.length === 0 || exports.some(expected);
    };
    const surfaceModules = new Set(byPackage.get(name) ?? []);
    /** @type {Record<string, ModuleRecord>} */
    const published = record.published ? record.modules : {};
    const shipped = new Set(Object.keys(published).filter((m) => published[m].runtime || published[m].types));
    /** @type {Differences} */
    const entry = {
      modulesNotShipped: [...surfaceModules].filter((m) => !shipped.has(m) && expectedModule(m)).sort(compare),
      modulesNotInSurface: [...shipped].filter((m) => !surfaceModules.has(m)).sort(compare),
      tokensNotShipped: {},
      tokensNotInSurface: {},
      kinds: {},
    };
    for (const module of [...surfaceModules].filter((m) => shipped.has(m)).sort(compare)) {
      const kinds = publishedKinds(published[module]);
      const exports = surface.modules[module].exports;
      const notShipped = Object.keys(exports)
        .filter((n) => !kinds.has(n) && expected(exports[n]))
        .sort(compare);
      const notInSurface = [...kinds.keys()].filter((n) => !Object.hasOwn(exports, n)).sort(compare);
      /** @type {Differences['kinds'][string]} */
      const disagreeing = {};
      for (const exported of Object.keys(exports).sort(compare)) {
        const kind = kinds.get(exported);
        if (kind && kind !== exports[exported].kind) {
          disagreeing[exported] = { published: kind, surface: exports[exported].kind };
        }
      }
      if (notShipped.length) entry.tokensNotShipped[module] = notShipped;
      if (notInSurface.length) entry.tokensNotInSurface[module] = notInSurface;
      if (Object.keys(disagreeing).length) entry.kinds[module] = disagreeing;
    }
    differences[name] = entry;
  }
  const surfaceOnly = [...covered].filter((name) => !Object.hasOwn(packages, name)).sort(compare);
  return { differences, surfaceOnly, notInSurface: uncovered.sort(compare) };
}

/**
 * Shapes under the surface's source declaration ids: for each surface token the published types
 * also export, the shape of the published declaration when its local name is the source's (a
 * bundler's `$1` de-duplication suffix aside; a source `#default` matches a declaration its file
 * exports as default).
 * @param {Surface} surface
 * @param {Map<string, string>} shapes
 * @param {Map<string, Declaration>} declarations  `<module>\0<export>` -> published declaration
 * @returns {Map<string, string>}
 */
export function sourceShapes(surface, shapes, declarations) {
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const module of Object.keys(surface.modules).sort(compare)) {
    const { exports } = surface.modules[module];
    for (const exported of Object.keys(exports).sort(compare)) {
      const { decl } = exports[exported];
      if (!decl || decl.startsWith('external:') || out.has(decl)) continue;
      const declaration = declarations.get(`${module}\0${exported}`);
      const shape = declaration ? shapes.get(declarationId(declaration)) : undefined;
      if (!declaration || shape === undefined) continue;
      const sourceName = decl.slice(decl.lastIndexOf('#') + 1);
      const publishedName = declaration.local.replace(/\$\d+$/, '');
      if (sourceName === publishedName || (sourceName === 'default' && declaration.viaDefault)) out.set(decl, shape);
    }
  }
  return out;
}

/**
 * Counts for a summary line.
 * @param {Audit} audit
 */
export function summarize(audit) {
  const totals = { packages: 0, unpublished: 0, modules: 0, tokens: 0, missing: 0 };
  for (const record of Object.values(audit.packages)) {
    totals.packages++;
    if (!record.published) {
      totals.unpublished++;
      continue;
    }
    for (const module of Object.values(record.modules)) {
      totals.modules++;
      totals.tokens += new Set([...(module.runtime?.names ?? []), ...(module.types?.names ?? [])]).size;
    }
    for (const byCondition of Object.values(record.missing)) {
      for (const targets of Object.values(byCondition)) totals.missing += targets.length;
    }
  }
  return totals;
}

/**
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
async function mapLimit(items, limit, fn) {
  /** @type {R[]} */
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}
