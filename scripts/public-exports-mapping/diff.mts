/**
 * `diffs/<a>-<b>.json`: what changed between two surfaces, and where every declaration of the
 * older one went (CONTRACT.md, area B).
 *
 * A diff is complete: `applyDiff(surfaceA, diffSurfaces(surfaceA, surfaceB, history))` is
 * surface `b` again, byte for byte once canonicalized, so a reader that ships one baseline
 * surface and the diffs can rebuild every later surface. Nothing in this file touches git or
 * the file system; `history.mts` produces the `history` it reads.
 */
import { canonical } from './artifacts.mts';

export type ExportRecord = { kind: 'value' | 'type'; decl: string; deprecated?: true };

export type ModuleRecord = {
  package: string;
  entry: string;
  forward: string | null;
  exports: Record<string, ExportRecord>;
};

export type PackageRecord = { dir: string; modules: string[] };

export type Surface = {
  schema: 1;
  kind: 'surface';
  version: string;
  tag: string | null;
  packages: Record<string, PackageRecord>;
  modules: Record<string, ModuleRecord>;
};

export type SymbolMove = { commit: string; subject: string; added: string[] };

export type History = {
  schema: 1;
  kind: 'history';
  from: string;
  to: string;
  files: Record<string, string[]>;
  symbols: Record<string, SymbolMove>;
};

/** One group of changes to a map of records; a key that is absent has no entries. */
export type RecordChanges = {
  added?: Record<string, Record<string, unknown>>;
  removed?: string[];
  changed?: Record<string, Record<string, unknown>>;
};

export type Diff = {
  schema: 1;
  kind: 'diff';
  from: string;
  to: string;
  packages: RecordChanges;
  modules: RecordChanges;
  exports: Record<string, RecordChanges>;
  declarations: Record<string, string | null>;
};

export type Token = { module: string; name: string };

/** What `continuationOf` reads for one pair. */
export type Context = {
  history: History;
  kindsA: Map<string, 'value' | 'type'>;
  kindsB: Map<string, 'value' | 'type'>;
  tokensA: Map<string, Token[]>;
  surfaceB: Surface;
};

/**
 * Top-level keys a surface may carry. `version` and `tag` follow from the diff's `to`; the
 * others are carried by a section of the diff. A surface with any other key that differs
 * between `a` and `b` cannot be diffed completely, so `diffSurfaces` refuses it.
 */
const SURFACE_KEYS = new Set(['schema', 'kind', 'version', 'tag', 'packages', 'modules']);

/**
 * Attributes a record always carries. In a `changed` entry `null` means "absent in `b`"
 * unless the attribute is one of these, where `null` is the value itself (a module's
 * `forward`).
 */
const ALWAYS = {
  package: new Set(['dir', 'modules']),
  module: new Set(['package', 'entry', 'forward']),
  export: new Set(['kind', 'decl']),
};

/**
 * Every declaration id a surface references, sorted.
 */
export function declarationIds(surface: Surface): string[] {
  return [...declarationKinds(surface).keys()].sort();
}

/**
 * The kind of every declaration of a surface: `value` when any export of it is a value,
 * else `type`.
 */
export function declarationKinds(surface: Surface): Map<string, 'value' | 'type'> {
  const kinds: Map<string, 'value' | 'type'> = new Map();
  for (const module of Object.values(surface.modules)) {
    for (const { decl, kind } of Object.values(module.exports)) {
      if (kinds.get(decl) !== 'value') kinds.set(decl, kind);
    }
  }
  return kinds;
}

/**
 * The tokens of a surface by the declaration they carry, each list in module order, then in
 * export name order.
 */
function tokensByDeclaration(surface: Surface): Map<string, Token[]> {
  const tokens: Map<string, Token[]> = new Map();
  for (const module of Object.keys(surface.modules).sort()) {
    for (const name of Object.keys(surface.modules[module].exports).sort()) {
      const { decl } = surface.modules[module].exports[name];
      const list = tokens.get(decl);
      if (list) list.push({ module, name });
      else tokens.set(decl, [{ module, name }]);
    }
  }
  return tokens;
}

/**
 * Splits `<file>#<name>`; `null` for an `external:` id, which names no file of the tree.
 */
export function splitDeclarationId(id: string): { file: string; name: string } | null {
  const hash = id.lastIndexOf('#');
  if (id.startsWith('external:') || hash < 1) return null;
  return { file: id.slice(0, hash), name: id.slice(hash + 1) };
}

/**
 * The paths of the newer tree that continue `file` of the older one: its `history.files`
 * entry (empty when it was deleted), or the file itself when git saw no move.
 */
export function followFiles(files: Record<string, string[]>, file: string): string[] {
  return Object.hasOwn(files, file) ? files[file] : [file];
}

/**
 * The declaration surface `b` gives a token that carried `id` in surface `a`, when that token
 * still exists and the declaration lies in the declaring file of `id` or in a file `files`
 * says continues it: how a default export that became a named one continues
 * (`store-service.ts#default` to `store-service.ts#Store`, under `@ember-data/store` `default`).
 * @param parsed  `id`, split
 */
function keptToken(
  id: string,
  { file, name }: { file: string; name: string },
  { history, tokensA, surfaceB }: Context
): string | null {
  const places = new Set([file, ...followFiles(history.files, file)]);
  const kept: string[] = [];
  for (const token of tokensA.get(id) ?? []) {
    const module = Object.hasOwn(surfaceB.modules, token.module) ? surfaceB.modules[token.module] : null;
    const record = module && Object.hasOwn(module.exports, token.name) ? module.exports[token.name] : null;
    const target = record && splitDeclarationId(record.decl);
    if (record && target && places.has(target.file)) kept.push(record.decl);
  }
  // When the tokens disagree, the declaration with the local name of `id` wins, else the one of
  // the first token in module order (then export name order). Coming after the files rule, a
  // declaration with that local name in these files only turns up when `files` and surface `b`
  // disagree, so in practice the module order decides.
  return kept.find((decl) => splitDeclarationId(decl)?.name === name) ?? kept[0] ?? null;
}

/**
 * The declarations of surface `b` with the kind `id` has in surface `a` that the commit
 * removing `id` added.
 * @param id  a declaration with a `symbols` entry
 */
function addedOfSameKind(
  id: string,
  history: History,
  kindsA: Map<string, 'value' | 'type'>,
  kindsB: Map<string, 'value' | 'type'>
) {
  return history.symbols[id].added.filter((added) => kindsB.get(added) === kindsA.get(id));
}

/**
 * The declaration the commit removing `id` moved it to, by name: the only added declaration
 * of the same kind with the same binding name, or for a default export, also the only one in
 * the declaring file or a file continuing it (a default export that became a named one).
 * @param id  a declaration with a `symbols` entry
 */
function movedByName(
  id: string,
  history: History,
  kindsA: Map<string, 'value' | 'type'>,
  kindsB: Map<string, 'value' | 'type'>
): string | null {
  const { file, name } = splitDeclarationId(id) as { file: string; name: string };
  const places = new Set([file, ...followFiles(history.files, file)]);
  const matches = addedOfSameKind(id, history, kindsA, kindsB).filter((added) => {
    const target = splitDeclarationId(added) as { file: string; name: string };
    return target.name === name || (name === 'default' && places.has(target.file));
  });
  return matches.length === 1 ? matches[0] : null;
}

/**
 * The id a declaration of surface `a` has in surface `b`, or `null` when nothing there
 * continues it.
 *
 * 1. File moves: the same binding in a file that continues the declaring file, the declaring
 *    file itself first when it survives, else the first such path.
 * 2. Tokens: the declaration surface `b` gives a token that carried `id`, when it lies in the
 *    declaring file or a file continuing it (`keptToken`).
 * 3. The commit that removed it (`history.symbols`), among the declarations it added that
 *    surface `b` has with the same kind: the one `movedByName` finds; else the only one, when
 *    the commit added nothing outside surface `b` (whose kind is not on record, so it may be
 *    of the same kind) and removed no other declaration of that kind that this rule would
 *    also send there (a rename is one to one).
 * 4. Otherwise `null`, and the judge decides.
 */
export function continuationOf(id: string, context: Context): string | null {
  const { history, kindsA, kindsB } = context;
  const parsed = splitDeclarationId(id);
  if (!parsed) return kindsB.has(id) ? id : null;
  const targets = followFiles(history.files, parsed.file);
  const candidates = targets.map((file) => `${file}#${parsed.name}`).filter((candidate) => kindsB.has(candidate));
  if (candidates.includes(id)) return id;
  if (candidates.length) return candidates[0];
  const kept = keptToken(id, parsed, context);
  if (kept) return kept;
  if (!Object.hasOwn(history.symbols, id)) return null;
  const byName = movedByName(id, history, kindsA, kindsB);
  if (byName) return byName;
  const move = history.symbols[id];
  const sameKind = addedOfSameKind(id, history, kindsA, kindsB);
  if (sameKind.length !== 1 || move.added.some((added) => !kindsB.has(added))) return null;
  const rivals = Object.keys(history.symbols).filter(
    (other) =>
      other !== id &&
      history.symbols[other].commit === move.commit &&
      kindsA.get(other) === kindsA.get(id) &&
      !movedByName(other, history, kindsA, kindsB)
  );
  return rivals.length ? null : sameKind[0];
}

/**
 * The `added` / `removed` / `changed` sections for two maps of records. `added` holds the
 * whole record (without `omit`), `changed` every attribute whose value differs, set to its
 * value in `b` (`null` when `b` lacks it).
 * @param omit  an attribute that has its own section in the diff
 */
function recordChanges(
  before: Record<string, Record<string, unknown>>,
  after: Record<string, Record<string, unknown>>,
  omit?: string
): RecordChanges {
  const changes: Required<RecordChanges> = { added: {}, removed: [], changed: {} };
  for (const name of Object.keys(before).sort()) if (!Object.hasOwn(after, name)) changes.removed.push(name);
  for (const name of Object.keys(after).sort()) {
    if (!Object.hasOwn(before, name)) {
      const record = structuredClone(after[name]);
      if (omit) delete record[omit];
      changes.added[name] = record;
      continue;
    }
    const changed: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(before[name]), ...Object.keys(after[name])]);
    for (const key of [...keys].sort()) {
      if (key === omit) continue;
      const value = Object.hasOwn(after[name], key) ? after[name][key] : null;
      if (!Object.hasOwn(before[name], key) || canonical(before[name][key]) !== canonical(value)) changed[key] = value;
    }
    if (Object.keys(changed).length) changes.changed[name] = changed;
  }
  const pruned: RecordChanges = {};
  if (Object.keys(changes.added).length) pruned.added = changes.added;
  if (Object.keys(changes.changed).length) pruned.changed = changes.changed;
  if (changes.removed.length) pruned.removed = changes.removed;
  return pruned;
}

function isEmpty(changes: RecordChanges) {
  return !Object.keys(changes).length;
}

function assertSurface(surface: unknown, role: string): asserts surface is Surface {
  const s = surface as Partial<Surface> | null | undefined;
  if (!s || s.kind !== 'surface' || s.schema !== 1 || !s.modules || !s.packages) {
    throw new Error(`diff: surface ${role} is not a schema 1 surface`);
  }
}

/**
 * The tag a surface of `version` carries.
 */
function tagOf(version: string) {
  return version === 'head' ? null : `v${version}`;
}

/**
 * The diff from `surfaceA` to `surfaceB`. `history` is `history/<a>-<b>.json` for the same
 * pair; its `files` and `symbols` decide `declarations`, which lists only the ids that do not
 * keep their id. Every group carries only what changed. Throws rather than return a diff that
 * `applyDiff` would not turn back into `surfaceB`.
 */
export function diffSurfaces(surfaceA: Surface, surfaceB: Surface, history: History): Diff {
  assertSurface(surfaceA, 'a');
  assertSurface(surfaceB, 'b');
  const { version: from } = surfaceA;
  const { version: to } = surfaceB;
  if (history?.kind !== 'history' || history.from !== from || history.to !== to) {
    throw new Error(`diff ${from}-${to}: the history is not history/${from}-${to}.json`);
  }
  if (surfaceB.tag !== tagOf(to)) {
    throw new Error(`diff ${from}-${to}: surface ${to} has the tag ${surfaceB.tag}, not ${tagOf(to)}`);
  }
  for (const key of new Set([...Object.keys(surfaceA), ...Object.keys(surfaceB)])) {
    const a = (surfaceA as Record<string, unknown>)[key];
    const b = (surfaceB as Record<string, unknown>)[key];
    if (!SURFACE_KEYS.has(key) && canonical(a ?? null) !== canonical(b ?? null)) {
      throw new Error(`diff ${from}-${to}: the surfaces differ in "${key}", which no section of a diff carries`);
    }
  }

  const exports: Record<string, RecordChanges> = {};
  for (const module of Object.keys(surfaceB.modules).sort()) {
    const changes = recordChanges(surfaceA.modules[module]?.exports ?? {}, surfaceB.modules[module].exports);
    if (!isEmpty(changes)) exports[module] = changes;
  }

  const context: Context = {
    history,
    kindsA: declarationKinds(surfaceA),
    kindsB: declarationKinds(surfaceB),
    tokensA: tokensByDeclaration(surfaceA),
    surfaceB,
  };
  const declarations: Record<string, string | null> = {};
  for (const id of [...context.kindsA.keys()].sort()) {
    const next = continuationOf(id, context);
    if (next !== id) declarations[id] = next;
  }

  const diff: Diff = {
    schema: 1,
    kind: 'diff',
    from,
    to,
    packages: recordChanges(surfaceA.packages, surfaceB.packages),
    modules: recordChanges(surfaceA.modules, surfaceB.modules, 'exports'),
    exports,
    declarations,
  };
  if (canonical(applyDiff(surfaceA, diff)) !== canonical(surfaceB)) {
    throw new Error(`diff ${from}-${to}: surface ${to} holds a value no section of a diff can carry`);
  }
  return diff;
}

/**
 * Applies one section of a diff to a map of records, in place.
 * @param where  for error messages
 */
function applyChanges(
  records: Record<string, Record<string, unknown>>,
  changes: RecordChanges,
  what: 'package' | 'module' | 'export',
  where: string
) {
  for (const name of changes.removed ?? []) {
    if (!Object.hasOwn(records, name)) throw new Error(`${where}: cannot remove ${what} ${name}, it does not exist`);
    delete records[name];
  }
  for (const [name, record] of Object.entries(changes.added ?? {})) {
    if (Object.hasOwn(records, name)) throw new Error(`${where}: cannot add ${what} ${name}, it exists`);
    records[name] = structuredClone(record);
    if (what === 'module') records[name].exports = {};
  }
  for (const [name, changed] of Object.entries(changes.changed ?? {})) {
    if (!Object.hasOwn(records, name)) throw new Error(`${where}: cannot change ${what} ${name}, it does not exist`);
    for (const [key, value] of Object.entries(changed)) {
      if (value === null && !ALWAYS[what].has(key)) delete records[name][key];
      else records[name][key] = structuredClone(value);
    }
  }
}

/**
 * Rebuilds surface `b` from surface `a` and the diff from `a` to `b`.
 */
export function applyDiff(surfaceA: Surface, diff: Diff): Surface {
  assertSurface(surfaceA, 'a');
  const where = `diff ${diff.from}-${diff.to}`;
  if (diff.kind !== 'diff' || diff.from !== surfaceA.version) {
    throw new Error(`${where}: does not apply to surface ${surfaceA.version}`);
  }
  const surface = structuredClone(surfaceA);
  surface.version = diff.to;
  surface.tag = tagOf(diff.to);
  applyChanges(surface.packages, diff.packages, 'package', where);
  applyChanges(surface.modules, diff.modules, 'module', where);
  for (const [module, changes] of Object.entries(diff.exports)) {
    if (!Object.hasOwn(surface.modules, module)) throw new Error(`${where}: exports of ${module}, a module it lacks`);
    applyChanges(surface.modules[module].exports, changes, 'export', `${where} ${module}`);
  }
  return surface;
}
