/**
 * Surface vs published package (area C of CONTRACT.md): `audits/<version>.json` and
 * `shapes/<version>.json`.
 *
 * The audit records, per non-private package of a release, what npm has at the version the tag's
 * `package.json` names (see `published.mts`) and, when the version has a surface, how the
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
import path from 'node:path';

import { REPO_ROOT } from './artifacts.mts';
import { surfacePath } from './data.mts';
import {
  type Declaration,
  declarationId,
  fetchTarball,
  type ModuleRecord,
  openPublished,
  type Pack,
  type PackageRef,
  packagesAt,
  type PublishedPackage,
  type PublishedRecord,
  PublishedRelease,
  type Tarball,
} from './published.mts';

export interface SurfaceExport {
  kind: 'value' | 'type';
  decl: string;
  deprecated?: boolean;
}

export interface SurfaceModule {
  package: string;
  entry?: string;
  forward?: string | null;
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

export interface Differences {
  modulesNotShipped: string[];
  modulesNotInSurface: string[];
  tokensNotShipped: Record<string, string[]>;
  tokensNotInSurface: Record<string, string[]>;
  kinds: Record<string, Record<string, { published: 'value' | 'type'; surface: 'value' | 'type' }>>;
}

export type PackageAudit = ({ dir: string } & PublishedRecord) | { dir: string; version: string; published: false };

export type PackageEntry = PackageAudit & { differences?: Differences };

export interface Audit {
  schema: 1;
  kind: 'audit';
  version: string;
  tag: string | null;
  surface: string | null;
  packages: Record<string, PackageEntry>;
  packagesNotInSurface?: string[];
  surfacePackagesNotInRelease?: string[];
}

export interface Shapes {
  schema: 1;
  kind: 'shapes';
  version: string;
  tag: string | null;
  shapes: Record<string, string>;
}

export interface AuditOptions {
  surface?: Surface | null;
  surfaceFile?: string;
  packages?: PackageRef[];
  cacheDir?: string;
  pack?: Pack;
  concurrency?: number;
}

function compare(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The audit and the shapes of one release, and the tarballs read for it.
 * @param version  a release version, or `head`
 */
export async function auditRelease(
  version: string,
  options: AuditOptions = {}
): Promise<{ audit: Audit; shapes: Shapes; tarballs: Tarball[] }> {
  const { surface = null, cacheDir, pack, concurrency = 6 } = options;
  const packages = options.packages ?? packagesAt(version);
  const tarballs = await mapLimit(packages, concurrency, (ref) =>
    fetchTarball(ref.name, ref.version, { cacheDir, pack })
  );

  const opened: Map<string, PublishedPackage> = new Map();
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

  const records: Record<string, PackageEntry> = {};
  for (const ref of packages) {
    const pkg = opened.get(ref.name);
    records[ref.name] = pkg
      ? { dir: ref.dir, ...release.describe(pkg) }
      : { dir: ref.dir, version: ref.version, published: false };
  }

  const tag = version === 'head' ? null : `v${version}`;
  const audit: Audit = { schema: 1, kind: 'audit', version, tag, surface: null, packages: records };
  if (surface) {
    const file = options.surfaceFile ?? surfacePath(version);
    audit.surface = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    const { differences, surfaceOnly, notInSurface } = compareWithSurface(records, surface);
    for (const [name, entry] of Object.entries(differences)) records[name].differences = entry;
    audit.packagesNotInSurface = notInSurface;
    audit.surfacePackagesNotInRelease = surfaceOnly;
  }

  const { shapes, declarations } = release.shapes();
  const all: Map<string, string> = new Map(shapes);
  if (surface) {
    for (const [id, shape] of sourceShapes(surface, shapes, declarations)) if (!all.has(id)) all.set(id, shape);
  }
  const shapesFile: Shapes = { schema: 1, kind: 'shapes', version, tag, shapes: Object.fromEntries(all) };
  return { audit, shapes: shapesFile, tarballs };
}

/**
 * `audits/<version>.json`: the published side of every package of the release and, when a surface
 * is given, its differences against the surface.
 */
export async function auditOf(version: string, options: AuditOptions = {}): Promise<Audit> {
  return (await auditRelease(version, options)).audit;
}

/**
 * The kind a published module gives each of its names: `value` when its JS exports the name,
 * else `type`.
 */
export function publishedKinds(record: ModuleRecord): Map<string, 'value' | 'type'> {
  const kinds: Map<string, 'value' | 'type'> = new Map();
  for (const name of record.types?.names ?? []) kinds.set(name, 'type');
  for (const name of record.runtime?.names ?? []) kinds.set(name, 'value');
  return kinds;
}

/**
 * The differences between the published packages and a surface, per package the surface covers.
 * @returns `surfaceOnly`: packages of the surface the release does not have; `notInSurface`: packages of
 *   the release the surface does not cover
 */
export function compareWithSurface(
  packages: Record<string, PackageAudit>,
  surface: Surface
): { differences: Record<string, Differences>; surfaceOnly: string[]; notInSurface: string[] } {
  const byPackage: Map<string, string[]> = new Map();
  for (const [module, entry] of Object.entries(surface.modules)) {
    const list = byPackage.get(entry.package);
    if (list) list.push(module);
    else byPackage.set(entry.package, [module]);
  }
  const covered = new Set([...Object.keys(surface.packages ?? {}), ...byPackage.keys()]);
  const differences: Record<string, Differences> = {};
  const uncovered: string[] = [];
  for (const [name, record] of Object.entries(packages)) {
    if (!covered.has(name)) {
      uncovered.push(name);
      continue;
    }
    // without published types only values can be checked: a type export, or a module that exports
    // types and nothing else, is not expected to ship
    const valuesOnly = record.published && record.types === 'not published';
    const expected = (entry: SurfaceExport) => !valuesOnly || entry.kind === 'value';
    const expectedModule = (module: string) => {
      const exports = Object.values(surface.modules[module].exports);
      return exports.length === 0 || exports.some(expected);
    };
    const surfaceModules = new Set(byPackage.get(name) ?? []);
    const published: Record<string, ModuleRecord> = record.published ? record.modules : {};
    const shipped = new Set(Object.keys(published).filter((m) => published[m].runtime || published[m].types));
    const entry: Differences = {
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
      const disagreeing: Differences['kinds'][string] = {};
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
 * @param declarations  `<module>\0<export>` -> published declaration
 */
export function sourceShapes(
  surface: Surface,
  shapes: Map<string, string>,
  declarations: Map<string, Declaration>
): Map<string, string> {
  const out: Map<string, string> = new Map();
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
 */
export function summarize(audit: Audit) {
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

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
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
