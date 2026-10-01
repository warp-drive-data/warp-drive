/**
 * Area E of the public exports mapping pipeline (see CONTRACT.md): the judge.
 *
 * Some tokens of a release's surface have no continuation git can prove: their declaration
 * chains to `null` through the diffs and no later surface declares it again, or it chains to an
 * id that no export of the target release carries.
 * This module collects that residue, gathers the evidence a reviewer would read (the declaring
 * source, the commit that removed it, candidate exports of the target release with their source
 * and shape), asks Claude through the Message Batches API which candidate continues each
 * declaration or whether it was removed, and turns confident answers into `decisions/<from>.json`.
 *
 * ## Judges
 *
 * `--judge claude`, the default, is the judge described here. `--judge jev` asks TypeSafe AI's Jev
 * the same question over the same evidence (jev.mjs, `TYPESAFE_API_KEY`). `--import
 * <answers.json>` records answers a person or the project thread gave from the dry-run bundles,
 * `{ "<decl>": { "choice": { module, export } | null, "confidence": n, "reason": "..." } }`, as
 * `judge: "thread"`; they go through the same checks as a model's answer (`validateAnswer`, then
 * `decide`). The judge `preferences.json` names (`judge`, default `claude`) writes
 * `decisions/<from>.json`. Any other judge writes `<out>/<from>-<to>/decisions.<judge>.json` and
 * marks its other outputs the same way (`answers.jev.json`, `judge-review.jev.json`), so a second
 * judge never touches the committed decisions. `judge --compare <a> <b>` prints where two such
 * files (or review or answers files) agree, where they differ, and the entries below the
 * threshold.
 *
 * ## Live procedure
 *
 * The judge reads `ANTHROPIC_API_KEY` from the environment and nothing else reads or stores it.
 * Every request goes through the Message Batches API with `claude-opus-5-5`.
 *
 * 1. `export ANTHROPIC_API_KEY=...`
 * 2. `node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --dry-run` prints the
 *    residue and writes the evidence bundles and the exact request bodies; read a few bundles.
 * 3. `node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --calibrate` judges, blind,
 *    declarations git settled (through a `history.symbols` entry, a file move, or an unchanged
 *    id, taken in turn so that `--limit 60` keeps the mix) with the true successor hidden among
 *    the candidates, and prints agreement per confidence bucket and per kind. Pick the lowest
 *    threshold whose agreement you accept. Nothing is written to `decisions/`.
 * 4. `node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --threshold <t>` judges the
 *    residue and writes `decisions/4.12.8.json` with every answer at or above the threshold whose
 *    choice is a token of the target surface. The other answers go to `judge-review.json` in the
 *    output directory and are listed on stdout.
 * 5. Review: decide the `judge-review.json` entries by hand and add the ones you accept to
 *    `decisions/4.12.8.json`; read the written entries, trim each `shim`, and set `reviewed` to
 *    `true` on the entries you checked.
 * 6. `node scripts/public-exports-mapping/cli.mjs judge --check`, then commit the decisions file.
 *
 * A run interrupted while polling resumes with `--batch <id>` (the id is in `batches.json`).
 * Declarations that already have a decision are not judged again; delete an entry to re-judge it.
 * A stale decision (its `decl` left the `from` surface or its `choice` left the `to` surface) is
 * dropped and judged again. A usage error or a missing input throws, which cli.mjs reports with
 * exit code 1; `--check` exits 1 when it finds a problem.
 *
 * ## Cost
 *
 * One request per declaration. The dry run prints the request count, the size of the request
 * bodies and an estimate of their input tokens; output is the thinking and the tool call, about
 * 1-3k tokens per request; batches are billed at half the standard rate. For 4.12.8 to 5.9.1 that
 * was 34 requests and about 140k input tokens for the judge, and 91 requests and about 410k for
 * `--calibrate`: a few dollars for both.
 *
 * ## Outputs
 *
 * Scratch output goes to `<out>/<from>-<to>/` (`--out`, default `tmp/public-exports-judge`, which
 * git ignores): `bundles.json` (evidence per declaration) and `requests.json` (the exact
 * `messages.batches.create` body) on every run; `batches.json`, `answers.json` and
 * `judge-review.json` after a live run; the same with a `calibration-` prefix, plus
 * `calibration.json`, for `--calibrate`.
 *
 * ## Request shape
 *
 * `claude-opus-5-5` rejects a forced `tool_choice` (`{ type: 'tool' }` or `{ type: 'any' }`) with
 * a 400, in batches too. The answer shape is enforced by a `strict` tool instead, with
 * `tool_choice: { type: 'auto', disable_parallel_tool_use: true }` and an instruction to call it
 * once; a result without a valid call is retried in a follow-up batch. Strict schemas cannot carry
 * `minimum`/`maximum`, so `confidence` is clamped to 0..1 here.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseSync } from 'oxc-parser';

import { DATA_ROOT, REPO_ROOT, readJson } from './artifacts.mjs';

export const JUDGE_MODEL = 'claude-opus-5-5';
export const TOOL_NAME = 'record_successor';
export const TEXT_LINE_CAP = 120;
export const DEFAULT_THRESHOLD = 0.8;
export const DEFAULT_EFFORT = 'medium';
export const DEFAULT_POLL_SECONDS = 60;
export const DEFAULT_TIE_BREAK = ['@warp-drive/ember'];
/** Most candidate declarations kept per discovery source, so one broad commit cannot flood a bundle. */
export const DEFAULT_CAPS = { history: 8, name: 8, file: 8 };
export const DEFAULT_OUT = path.join(REPO_ROOT, 'tmp', 'public-exports-judge');
const MAX_TOKENS = 16000;

/**
 * @typedef {{ module: string, export: string, kind: 'value' | 'type', decl: string, package: string, deprecated?: boolean }} Token
 * @typedef {{ index: number, from: string, to: string, id: string }} Break  where a chain hit `null` for good
 * @typedef {{ left: string, back: string }} Return  a pair that mapped the id to `null`, and the release that declares it again
 * @typedef {{ index: number, from: string, to: string }} Move  a pair that gave the id a new one
 * @typedef {{ id: string | null, brokeAt: Break | null, returned?: Return[], moves?: Move[] }} Chain
 * @typedef {{ from: string, to: string, declarations?: Record<string, string | null> }} Diff
 * @typedef {{ decl: string, tokens: Token[], chain: Chain }} ResidueItem
 * @typedef {Token & { via: string[] }} Candidate
 * @typedef {(args: string[]) => string} Git  runs git with these arguments, returns stdout, throws on failure
 * @typedef {{ module: string, export: string }} TokenRef
 * @typedef {{ decl: string, id: string, choice?: TokenRef | null, confidence?: number, reason?: string, error?: string, retryable?: boolean, usage?: Record<string, number> }} Answer
 */

// ---------------------------------------------------------------------------------------------
// Identity: tokens, declaration ids, modules

const compareStrings = (/** @type {string} */ a, /** @type {string} */ b) => (a < b ? -1 : a > b ? 1 : 0);
const tokenKey = (/** @type {string} */ module, /** @type {string} */ name) => `${module}\u0000${name}`;

/**
 * Splits a declaration id: `<file>#<local>`, `<file>#*<ns>` or `external:<specifier>#<name>`.
 * @param {string} id
 * @returns {{ file: string | null, specifier: string | null, local: string, namespace: boolean }}
 */
export function parseDecl(id) {
  const hash = id.lastIndexOf('#');
  const head = hash === -1 ? id : id.slice(0, hash);
  const raw = hash === -1 ? '' : id.slice(hash + 1);
  const namespace = raw.startsWith('*');
  const local = namespace ? raw.slice(1) : raw;
  if (head.startsWith('external:')) return { file: null, specifier: head.slice('external:'.length), local, namespace };
  return { file: head, specifier: null, local, namespace };
}

/** @param {string} module */
export function packageName(module) {
  const parts = module.split('/');
  return module.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** A module is public unless a path segment is `-private` or starts with `-`. @param {string} module */
export function isPublicModule(module) {
  return !module.split('/').some((segment) => segment.startsWith('-'));
}

/** `ember-data` and `@ember-data/*` are the old contract. @param {string} pkg */
export function isOldContract(pkg) {
  return pkg === 'ember-data' || pkg.startsWith('@ember-data/');
}

/** @param {string} module */
export function segmentsOf(module) {
  return module.split('/').length;
}

/**
 * The contract's ranking: the first rule that separates two tokens wins.
 * @param {Token} a
 * @param {Token} b
 * @param {{ sourceName?: string, tieBreak?: string[] }} [options]
 */
export function compareTokens(a, b, { sourceName, tieBreak = DEFAULT_TIE_BREAK } = {}) {
  const tie = (/** @type {string} */ module) => {
    const i = tieBreak.findIndex((entry) => module === entry || module.startsWith(`${entry}/`));
    return i === -1 ? tieBreak.length : i;
  };
  return (
    Number(!isPublicModule(a.module)) - Number(!isPublicModule(b.module)) ||
    Number(isOldContract(a.package)) - Number(isOldContract(b.package)) ||
    segmentsOf(a.module) - segmentsOf(b.module) ||
    Number(Boolean(a.deprecated)) - Number(Boolean(b.deprecated)) ||
    Number(a.kind === 'type') - Number(b.kind === 'type') ||
    (sourceName === undefined ? 0 : Number(a.export !== sourceName) - Number(b.export !== sourceName)) ||
    tie(a.module) - tie(b.module) ||
    compareStrings(a.module, b.module) ||
    compareStrings(a.export, b.export)
  );
}

/** The source token a decision names: the best-ranked token of its declaration. @param {Token[]} tokens @param {string[]} [tieBreak] */
export function representative(tokens, tieBreak = DEFAULT_TIE_BREAK) {
  return [...tokens].sort((a, b) => compareTokens(a, b, { tieBreak }))[0];
}

/**
 * @param {any} surface  a `surfaces/<version>.json` document
 * @returns {Token[]} every export, sorted by module then name
 */
export function tokensOf(surface) {
  /** @type {Token[]} */
  const out = [];
  for (const [module, mod] of Object.entries(surface?.modules ?? {})) {
    for (const [name, entry] of Object.entries(mod.exports ?? {})) {
      /** @type {Token} */
      const token = {
        module,
        export: name,
        kind: entry.kind,
        decl: entry.decl,
        package: mod.package ?? packageName(module),
      };
      if (entry.deprecated) token.deprecated = true;
      out.push(token);
    }
  }
  return out.sort((a, b) => compareStrings(a.module, b.module) || compareStrings(a.export, b.export));
}

/**
 * Names a declaration answers to: its local name and every name it is exported under.
 * @param {string} decl
 * @param {Token[]} tokens
 */
function declNames(decl, tokens) {
  const { local } = parseDecl(decl);
  const names = new Set();
  if (local && local !== 'default') names.add(local);
  for (const t of tokens) if (t.export !== 'default') names.add(t.export);
  return [...names];
}

/**
 * Lookup tables over one surface.
 * @param {any} surface
 * @param {{ ignorePackages?: Iterable<string> }} [options]  packages whose tokens are left out
 */
export function indexSurface(surface, { ignorePackages = [] } = {}) {
  const ignored = new Set(ignorePackages);
  const tokens = tokensOf(surface).filter((t) => !ignored.has(t.package));
  /** @type {Map<string, Token[]>} */ const byDecl = new Map();
  /** @type {Map<string, string[]>} */ const byFile = new Map();
  /** @type {Map<string, string[]>} */ const byName = new Map();
  /** @type {Map<string, string[]>} */ const byLower = new Map();
  /** @type {Map<string, string[]>} */ const names = new Map();
  const keys = new Set();
  const push = (/** @type {Map<string, any[]>} */ map, /** @type {string} */ key, /** @type {any} */ value) => {
    const list = map.get(key);
    if (!list) map.set(key, [value]);
    else if (!list.includes(value)) list.push(value);
  };
  for (const t of tokens) {
    keys.add(tokenKey(t.module, t.export));
    push(byDecl, t.decl, t);
  }
  for (const [decl, list] of byDecl) {
    const { file } = parseDecl(decl);
    if (file) push(byFile, file, decl);
    const own = declNames(decl, list);
    names.set(decl, own);
    for (const n of own) {
      push(byName, n, decl);
      push(byLower, n.toLowerCase(), decl);
    }
  }
  return {
    surface,
    tokens,
    byDecl,
    byFile,
    byName,
    byLower,
    names,
    /** @param {string} module @param {string} name */
    has: (module, name) => keys.has(tokenKey(module, name)),
  };
}

/** @typedef {ReturnType<typeof indexSurface>} SurfaceIndex */

// ---------------------------------------------------------------------------------------------
// Releases and inputs

/** The git revision of a version: its tag, or `HEAD` for the working tree. @param {string} version */
export function refOf(version) {
  return version === 'head' ? 'HEAD' : `v${version}`;
}

/**
 * The versions from `from` to `to`, both included, in release order.
 * @param {string} from
 * @param {string} to
 * @param {string[]} versions  the releases, oldest first, optionally ending in `head`
 */
export function versionsBetween(from, to, versions) {
  const a = versions.indexOf(from);
  const b = versions.indexOf(to);
  if (a === -1) throw new InputError(`${from} is not a covered release (${versions.join(', ')})`);
  if (b === -1) throw new InputError(`${to} is not a covered release (${versions.join(', ')})`);
  if (b <= a) throw new InputError(`--to ${to} must come after --from ${from}`);
  return versions.slice(a, b + 1);
}

export class InputError extends Error {}

/**
 * Orders pair documents (diffs or histories, as an array or an object) from `from` to `to`.
 * @template {{ from: string, to: string }} T
 * @param {T[] | Record<string, T>} list
 * @param {string} from
 * @param {string} to
 * @param {string} what
 * @returns {T[]}
 */
export function inOrder(list, from, to, what) {
  const all = Array.isArray(list) ? list : Object.values(list ?? {});
  /** @type {T[]} */
  const out = [];
  let current = from;
  while (current !== to) {
    const start = current;
    const next = all.find((doc) => doc && doc.from === start);
    if (!next || out.length > all.length) throw new InputError(`${what}: nothing leads from ${current} towards ${to}`);
    out.push(next);
    current = next.to;
  }
  return out;
}

/** @param {any} surfaces @param {string} version */
function surfaceAt(surfaces, version) {
  const surface = Array.isArray(surfaces) ? surfaces.find((s) => s.version === version) : surfaces?.[version];
  if (!surface) throw new InputError(`no surface for ${version}`);
  return surface;
}

/**
 * Reads what the judge needs for one (from, to) pair from a data directory laid out as the
 * contract describes: the surface of every release from `from` to `to` (a chain that breaks
 * looks its id up in the later ones), and the diff and history of every pair between them.
 * Shapes, preferences and existing decisions are optional.
 * @param {{ from: string, to: string, versions: string[], dataRoot?: string }} options
 */
export function loadInputs({ from, to, versions, dataRoot = DATA_ROOT }) {
  const list = versionsBetween(from, to, versions);
  const pairs = list.slice(1).map((b, i) => `${list[i]}-${b}`);
  /** @type {string[]} */
  const missing = [];
  const read = (/** @type {string} */ rel, optional = false) => {
    const file = path.join(dataRoot, rel);
    if (existsSync(file)) return readJson(file);
    if (!optional) missing.push(rel);
    return null;
  };
  const surfaces = Object.fromEntries(list.map((version) => [version, read(`surfaces/${version}.json`)]));
  const diffs = pairs.map((pair) => read(`diffs/${pair}.json`));
  const history = pairs.map((pair) => read(`history/${pair}.json`));
  const shapes = read(`shapes/${to}.json`, true);
  const preferences = read('preferences.json', true);
  const decisions = read(`decisions/${from}.json`, true);
  if (missing.length) {
    throw new InputError(`missing inputs in ${path.relative(REPO_ROOT, dataRoot) || '.'}: ${missing.join(', ')}`);
  }
  return { from, to, versions: list, surfaces, diffs, history, shapes: shapeMap(shapes), preferences, decisions };
}

/**
 * `shapes/<version>.json` maps declaration ids to strings; accept the map bare or under `shapes`.
 * @param {any} doc
 * @returns {Record<string, string>}
 */
function shapeMap(doc) {
  const map = doc?.shapes && typeof doc.shapes === 'object' ? doc.shapes : (doc ?? {});
  return Object.fromEntries(Object.entries(map).filter(([, v]) => typeof v === 'string'));
}

// ---------------------------------------------------------------------------------------------
// Residue

/** @type {WeakMap<object, Set<string>>} */
const declaredBySurface = new WeakMap();

/**
 * Whether the surface of `version` has an export whose declaration is `id`.
 * @param {any} surfaces  surfaces by version, as an object or an array; a missing one declares nothing
 * @param {string} version
 * @param {string} id
 */
function declares(surfaces, version, id) {
  const surface = Array.isArray(surfaces) ? surfaces.find((s) => s?.version === version) : surfaces?.[version];
  if (!surface) return false;
  let ids = declaredBySurface.get(surface);
  if (!ids) {
    ids = new Set(tokensOf(surface).map((t) => t.decl));
    declaredBySurface.set(surface, ids);
  }
  return ids.has(id);
}

/**
 * Follows a declaration id through consecutive diffs, pair by pair. An id a diff does not list
 * keeps its id. When a diff maps the id to `null`, the surfaces of the later releases, up to the
 * last diff's `to`, are searched in order for the same id, and the chain resumes from the first
 * that declares it: a 4.12 backport vanishes in 5.0.1 and comes back in 5.4.1 under the same id.
 * Only an id that no later surface declares breaks the chain, at the pair that dropped it.
 * @param {string} id
 * @param {Diff[]} diffs
 * @param {{ start?: number, surfaces?: any }} [options]  `start` is the index of the first diff to
 *   apply; `surfaces` holds the surfaces by version for the lookup
 * @returns {Chain}
 */
export function chainDecl(id, diffs, { start = 0, surfaces } = {}) {
  let current = id;
  /** @type {Return[]} */
  const returned = [];
  /** @type {Move[]} */
  const moves = [];
  const finish = (/** @type {Chain} */ chain) => ({
    ...chain,
    ...(returned.length ? { returned } : {}),
    ...(moves.length ? { moves } : {}),
  });
  for (let index = start; index < diffs.length; index++) {
    const map = diffs[index].declarations ?? {};
    const next = Object.hasOwn(map, current) ? map[current] : current;
    if (next !== null) {
      if (next !== current) moves.push({ index, from: current, to: next });
      current = next;
      continue;
    }
    const [dropped, droppedAt] = [current, index];
    const back = diffs.findIndex((diff, k) => k >= droppedAt && declares(surfaces, diff.to, dropped));
    if (back === -1) {
      return finish({ id: null, brokeAt: { index, from: diffs[index].from, to: diffs[index].to, id: current } });
    }
    returned.push({ left: `${diffs[index].from}-${diffs[index].to}`, back: diffs[back].to });
    index = back; // carry on with the diff that starts at the release that declares it again
  }
  return finish({ id: current, brokeAt: null });
}

/**
 * Follows a file through `history.files`; a file a history does not list stays where it is.
 * @param {string} file
 * @param {Array<{ files?: Record<string, string[]> }>} histories
 */
export function chainFile(file, histories) {
  let current = [file];
  let moved = false;
  for (const history of histories) {
    /** @type {string[]} */
    const next = [];
    for (const f of current) {
      if (Object.hasOwn(history.files ?? {}, f)) {
        moved = true;
        next.push(...history.files[f]);
      } else next.push(f);
    }
    current = [...new Set(next)];
  }
  return { files: current, moved };
}

/**
 * Splits the `from` surface's declarations into the ones git carries to an export of `to`
 * (settled) and the rest (residue). Tokens of `ignorePackages` (`preferences.json`) are in
 * neither, and are no candidates either.
 * @param {{ from: string, to: string, surfaces: any, diffs: any, ignorePackages?: Iterable<string> }} options
 */
export function classify({ from, to, surfaces, diffs, ignorePackages = [] }) {
  const ordered = inOrder(diffs, from, to, 'diffs');
  const ignored = new Set(ignorePackages);
  const toIndex = indexSurface(surfaceAt(surfaces, to), { ignorePackages: ignored });
  /** @type {Map<string, Token[]>} */
  const groups = new Map();
  for (const token of tokensOf(surfaceAt(surfaces, from))) {
    if (ignored.has(token.package)) continue;
    const list = groups.get(token.decl);
    if (list) list.push(token);
    else groups.set(token.decl, [token]);
  }
  /** @type {ResidueItem[]} */ const residue = [];
  /** @type {ResidueItem[]} */ const settled = [];
  for (const decl of [...groups.keys()].sort(compareStrings)) {
    const chain = chainDecl(decl, ordered, { surfaces });
    const item = { decl, tokens: /** @type {Token[]} */ (groups.get(decl)), chain };
    if (chain.id !== null && toIndex.byDecl.has(chain.id)) settled.push(item);
    else residue.push(item);
  }
  return { residue, settled, toIndex, diffs: ordered };
}

/**
 * The tokens of the `from` surface whose declaration chains to `null` in `to` (no later surface
 * declares it again either), or to an id no token of `to` carries, grouped by declaration id.
 * Each item keeps where its chain broke. Tokens of `preferences.ignorePackages` are never residue.
 * @param {{ from: string, to: string, surfaces: any, diffs: any, preferences?: any }} options
 * @returns {ResidueItem[]}
 */
export function residueOf({ from, to, surfaces, diffs, preferences = null }) {
  return classify({ from, to, surfaces, diffs, ignorePackages: preferences?.ignorePackages ?? [] }).residue;
}

/**
 * Everything evidence building needs, normalized once.
 * @param {{ from: string, to: string, surfaces: any, diffs: any, history: any, shapes?: Record<string, string>, preferences?: any, git?: Git, caps?: Partial<typeof DEFAULT_CAPS> }} options
 */
export function buildContext({
  from,
  to,
  surfaces,
  diffs,
  history,
  shapes = {},
  preferences = null,
  git = defaultGit(),
  caps,
}) {
  const ignorePackages = /** @type {string[]} */ (preferences?.ignorePackages ?? []);
  const { residue, settled, toIndex, diffs: ordered } = classify({ from, to, surfaces, diffs, ignorePackages });
  /** @type {Map<string, string[]>} */
  const continues = new Map();
  for (const item of settled) {
    const id = /** @type {string} */ (item.chain.id);
    continues.set(id, [...(continues.get(id) ?? []), item.decl]);
  }
  return {
    from,
    to,
    toIndex,
    surfaces,
    diffs: ordered,
    histories: inOrder(history, from, to, 'history'),
    shapes,
    tieBreak: /** @type {string[]} */ (preferences?.tieBreak ?? DEFAULT_TIE_BREAK),
    caps: { ...DEFAULT_CAPS, ...caps },
    git: memoize(git),
    residue,
    settled,
    continues,
    /** @type {Map<string, any>} */ parsed: new Map(),
    blind: false,
  };
}

/** @typedef {ReturnType<typeof buildContext>} Context */

/** @param {string} [cwd] @returns {Git} */
export function defaultGit(cwd = REPO_ROOT) {
  return (args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** @param {Git} git @returns {Git} */
function memoize(git) {
  /** @type {Map<string, { out?: string, error?: unknown }>} */
  const cache = new Map();
  return (args) => {
    const key = args.join('\u0000');
    let hit = cache.get(key);
    if (!hit) {
      try {
        hit = { out: git(args) };
      } catch (error) {
        hit = { error };
      }
      cache.set(key, hit);
    }
    if (hit.error) throw hit.error instanceof Error ? hit.error : new Error(String(hit.error));
    return /** @type {string} */ (hit.out);
  };
}

// ---------------------------------------------------------------------------------------------
// Candidates

/**
 * The names a residue declaration may live on under: its local name, the name its default
 * export declares (`extra`), and every name it was exported as.
 * @param {{ decl: string, tokens: Array<{ export: string }> }} item
 * @param {Array<string | null | undefined>} [extra]
 */
export function sourceNames(item, extra = []) {
  const { local } = parseDecl(item.decl);
  const names = new Set();
  if (local && local !== 'default') names.add(local);
  for (const n of extra) if (n && n !== 'default') names.add(n);
  for (const t of item.tokens) if (t.export !== 'default') names.add(t.export);
  return /** @type {string[]} */ ([...names]);
}

/** Levenshtein distance. @param {string} a @param {string} b */
export function editDistance(a, b) {
  if (a === b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * How alike two name lists are, for ordering only: exact (4) > case-insensitive (3) >
 * containment (2..3) > edit distance (0..1).
 * @param {string[]} names
 * @param {string[]} others
 */
function similarity(names, others) {
  let best = 0;
  for (const a of names) {
    for (const b of others) {
      const x = a.toLowerCase();
      const y = b.toLowerCase();
      const shorter = Math.min(x.length, y.length);
      const longer = Math.max(x.length, y.length, 1);
      const score =
        a === b
          ? 4
          : x === y
            ? 3
            : x.includes(y) || y.includes(x)
              ? 2 + shorter / longer
              : 1 - editDistance(x, y) / longer;
      best = Math.max(best, score);
    }
  }
  return best;
}

/**
 * Fills in what a hand-built context may leave out.
 * @param {any} ctx
 * @returns {Context}
 */
function withDefaults(ctx) {
  return {
    surfaces: {},
    histories: [],
    shapes: {},
    tieBreak: DEFAULT_TIE_BREAK,
    continues: new Map(),
    parsed: new Map(),
    blind: false,
    ...ctx,
    caps: { ...DEFAULT_CAPS, ...ctx.caps },
    git: ctx.git ?? defaultGit(),
  };
}

/** How many removing commits in a row history follows. */
const HISTORY_GENERATIONS = 8;

/** @param {Context} ctx @param {Break} at @returns {string[]} */
function addedAt(ctx, at) {
  return ctx.histories[at.index]?.symbols?.[at.id]?.added ?? [];
}

/**
 * Declarations of `to` reached from the history entry where the item's chain broke: what that
 * commit added, followed through the remaining diffs. An added declaration that breaks again is
 * followed through its own history entry, breadth first, but only when its name contains or is
 * contained in a source name, so a symbol renamed twice is followed and what a broad commit
 * happened to add is not. Each result records its generation, its lineage (how well the added
 * declaration it descends from matches the source names) and whether it sits in the file the
 * broken declaration moved to.
 * @param {ResidueItem} item
 * @param {Context} ctx
 * @param {string[]} names
 */
function historyDecls(item, ctx, names) {
  /** @type {Map<string, { generation: number, lineage: number, sameFile: boolean }>} */
  const out = new Map();
  const seen = new Set();
  let frontier = item.chain.brokeAt ? [{ at: item.chain.brokeAt, lineage: 0 }] : [];
  for (let generation = 1; frontier.length && generation <= HISTORY_GENERATIONS; generation++) {
    /** @type {typeof frontier} */
    const next = [];
    for (const { at, lineage } of frontier) {
      const brokenFile = parseDecl(at.id).file;
      const near = new Set(brokenFile ? [brokenFile, ...chainFile(brokenFile, [ctx.histories[at.index]]).files] : []);
      for (const added of addedAt(ctx, at)) {
        if (seen.has(`${at.index}:${added}`)) continue;
        seen.add(`${at.index}:${added}`);
        const { file, local } = parseDecl(added);
        const sameFile = Boolean(file && near.has(file));
        const chain = chainDecl(added, ctx.diffs, { start: at.index + 1, surfaces: ctx.surfaces });
        if (chain.id !== null) {
          if (ctx.toIndex.byDecl.has(chain.id) && !out.has(chain.id)) {
            out.set(chain.id, { generation, lineage, sameFile });
          }
        } else if (chain.brokeAt) {
          // follow it further only when it looks like the source under another name or path
          const own = local && local !== 'default' ? similarity(names, [local]) : 0;
          if (own >= 2) next.push({ at: chain.brokeAt, lineage: Math.max(lineage, own + (sameFile ? 0.5 : 0)) });
        }
      }
    }
    frontier = next;
  }
  return out;
}

/**
 * Declarations of `to` answering to one of `names`: exact matches; failing that,
 * case-insensitive ones; failing that, within two edits among names of six or more characters.
 * @param {string[]} names
 * @param {SurfaceIndex} toIndex
 * @returns {{ tier: 'exact' | 'case' | 'edit', decls: string[] }}
 */
function nameDecls(names, toIndex) {
  const collect = (/** @type {(name: string) => string[] | undefined} */ lookup) => [
    ...new Set(names.flatMap((n) => lookup(n) ?? [])),
  ];
  const exact = collect((n) => toIndex.byName.get(n));
  if (exact.length) return { tier: 'exact', decls: exact };
  const cased = collect((n) => toIndex.byLower.get(n.toLowerCase()));
  if (cased.length) return { tier: 'case', decls: cased };
  /** @type {Set<string>} */
  const near = new Set();
  for (const name of names) {
    if (name.length < 6) continue;
    const lower = name.toLowerCase();
    for (const [other, decls] of toIndex.byLower) {
      if (other.length < 6 || Math.abs(other.length - lower.length) > 2) continue;
      if (editDistance(lower, other) <= 2) for (const d of decls) near.add(d);
    }
  }
  return { tier: 'edit', decls: [...near] };
}

/** Declarations of `to` in the files the declaring file became. @param {ResidueItem} item @param {Context} ctx */
function fileDecls(item, ctx) {
  const { file } = parseDecl(item.decl);
  if (!file) return [];
  return chainFile(file, ctx.histories).files.flatMap((f) => ctx.toIndex.byFile.get(f) ?? []);
}

/**
 * Candidate declarations of `to` in discovery order (history, then name, then file). Within a
 * source, declarations that look like the source go first: their name contains a source name or
 * is contained in one, or history reached them through such a declaration (a symbol renamed
 * twice). Then history candidates go by generation, lineage and file; then declarations git
 * already continues from another `from` declaration go last, and the rest go by name likeness
 * and rank. Each source keeps at most `ctx.caps[source]` new declarations and counts what it
 * dropped.
 * @param {ResidueItem} item
 * @param {Context} ctx
 * @param {string[]} names
 */
function discover(item, ctx, names) {
  const continuesOthers = (/** @type {string} */ decl) =>
    (ctx.continues.get(decl) ?? []).some((other) => other !== item.decl);
  const sourceName = representative(item.tokens, ctx.tieBreak)?.export;
  const history = historyDecls(item, ctx, names);
  const order = (/** @type {string[]} */ decls) =>
    decls
      .map((decl) => {
        const h = history.get(decl);
        const score = similarity(names, ctx.toIndex.names.get(decl) ?? []);
        return {
          decl,
          alike: score >= 2 || (h?.lineage ?? 0) >= 2,
          generation: h?.generation ?? HISTORY_GENERATIONS + 1,
          lineage: h?.lineage ?? 0,
          sameFile: h?.sameFile ?? false,
          continued: continuesOthers(decl),
          score,
          best: representative(ctx.toIndex.byDecl.get(decl) ?? [], ctx.tieBreak),
        };
      })
      .sort(
        (a, b) =>
          Number(b.alike) - Number(a.alike) ||
          a.generation - b.generation ||
          b.lineage - a.lineage ||
          Number(b.sameFile) - Number(a.sameFile) ||
          Number(a.continued) - Number(b.continued) ||
          b.score - a.score ||
          compareTokens(a.best, b.best, { sourceName, tieBreak: ctx.tieBreak }) ||
          compareStrings(a.decl, b.decl)
      )
      .map((entry) => entry.decl);
  const byName = nameDecls(names, ctx.toIndex);
  /** @type {Array<[string, string[]]>} */
  const sources = [
    ['history', [...history.keys()]],
    [`name:${byName.tier}`, byName.decls],
    ['file', fileDecls(item, ctx)],
  ];
  /** @type {Map<string, { decl: string, via: string[] }>} */
  const groups = new Map();
  /** @type {Record<string, number>} */
  const omitted = {};
  for (const [via, decls] of sources) {
    const source = /** @type {keyof typeof DEFAULT_CAPS} */ (via.split(':')[0]);
    let kept = 0;
    for (const decl of order([...new Set(decls)].filter((d) => ctx.toIndex.byDecl.has(d)))) {
      const group = groups.get(decl);
      if (group) group.via.push(via);
      else if (kept < ctx.caps[source]) {
        groups.set(decl, { decl, via: [via] });
        kept++;
      } else omitted[source] = (omitted[source] ?? 0) + 1;
    }
  }
  return { groups: [...groups.values()], omitted };
}

/**
 * Candidate tokens of the `to` surface for one residue item, in discovery order: declarations
 * the removing commit added (`history`), declarations with the same name (`name:exact`, else
 * `name:case`, else `name:edit`), declarations in the files the declaring file moved to (`file`).
 * Each token carries `via`, every way its declaration was found.
 * @param {ResidueItem} item
 * @param {Partial<Context> & { toIndex: SurfaceIndex, diffs: any[], names?: string[] }} ctx
 * @returns {Candidate[]}
 */
export function candidatesFor(item, ctx) {
  const c = withDefaults(ctx);
  const names = ctx.names ?? sourceNames(item);
  const sourceName = representative(item.tokens, c.tieBreak)?.export;
  return discover(item, c, names).groups.flatMap(({ decl, via }) =>
    [...(c.toIndex.byDecl.get(decl) ?? [])]
      .sort((a, b) => compareTokens(a, b, { sourceName, tieBreak: c.tieBreak }))
      .map((token) => ({ ...token, via: [...via] }))
  );
}

// ---------------------------------------------------------------------------------------------
// Source text

/** @type {Record<string, 'ts' | 'tsx' | 'js' | 'jsx'>} */
const LANGS = { '.ts': 'ts', '.mts': 'ts', '.cts': 'ts', '.tsx': 'tsx', '.gts': 'ts', '.jsx': 'jsx' };

/** @param {string} file @returns {'ts' | 'tsx' | 'js' | 'jsx' | 'dts'} */
function langOf(file) {
  if (file.endsWith('.d.ts')) return 'dts';
  return LANGS[path.extname(file)] ?? 'js';
}

/** @param {any} node @returns {string | null} */
function nameOf(node) {
  if (!node) return null;
  return node.type === 'Identifier' ? node.name : typeof node.value === 'string' ? node.value : null;
}

/** @param {any} pattern @returns {string[]} */
function bindingNames(pattern) {
  if (!pattern) return [];
  switch (pattern.type) {
    case 'Identifier':
      return [pattern.name];
    case 'ObjectPattern':
      return pattern.properties.flatMap((/** @type {any} */ p) =>
        bindingNames(p.type === 'RestElement' ? p.argument : p.value)
      );
    case 'ArrayPattern':
      return pattern.elements.flatMap((/** @type {any} */ e) => bindingNames(e));
    case 'RestElement':
      return bindingNames(pattern.argument);
    case 'AssignmentPattern':
      return bindingNames(pattern.left);
    default:
      return [];
  }
}

/** The names a top-level statement declares. @param {any} node @returns {string[]} */
function declaredBy(node) {
  if (!node) return [];
  switch (node.type) {
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      return declaredBy(node.declaration);
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
    case 'ClassDeclaration':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
    case 'TSEnumDeclaration':
    case 'TSImportEqualsDeclaration':
    case 'TSModuleDeclaration':
      return node.id?.type === 'Identifier' ? [node.id.name] : [];
    case 'VariableDeclaration':
      return node.declarations.flatMap((/** @type {any} */ d) => bindingNames(d.id));
    default:
      return [];
  }
}

/**
 * The top-level statements that declare `local` (all of them: overloads, a class merged with an
 * interface). For `default`, the statement the default export names.
 * @param {any[]} body
 * @param {string} local
 * @param {boolean} namespace
 */
function findStatements(body, local, namespace) {
  const declaring = (/** @type {string} */ name) => body.filter((s) => declaredBy(s).includes(name));
  if (namespace) {
    return {
      statements: body.filter((s) => s.type === 'ExportAllDeclaration' && nameOf(s.exported) === local),
      declaredName: null,
    };
  }
  if (local !== 'default') return { statements: declaring(local), declaredName: null };
  const def = body.find((s) => s.type === 'ExportDefaultDeclaration');
  if (def) {
    const target = def.declaration;
    if (target.type === 'Identifier') {
      const found = declaring(target.name);
      return { statements: found.length ? found : [def], declaredName: /** @type {string | null} */ (target.name) };
    }
    return { statements: [def], declaredName: /** @type {string | null} */ (target.id?.name ?? null) };
  }
  for (const s of body) {
    if (s.type !== 'ExportNamedDeclaration' || s.source) continue;
    const spec = s.specifiers?.find((/** @type {any} */ sp) => nameOf(sp.exported) === 'default');
    const name = spec && nameOf(spec.local);
    if (name) return { statements: declaring(name), declaredName: /** @type {string | null} */ (name) };
  }
  return { statements: [], declaredName: null };
}

/**
 * The `@deprecated` paragraph of a JSDoc block, or null.
 * @param {string} doc
 */
export function deprecationNote(doc) {
  const lines = doc
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim());
  const at = lines.findIndex((line) => /(^|\s)@deprecated\b/.test(line));
  if (at === -1) return null;
  const note = [lines[at].slice(lines[at].indexOf('@deprecated'))];
  for (let i = at + 1; i < lines.length && lines[i] && !lines[i].startsWith('@'); i++) note.push(lines[i]);
  return note.join(' ').trim();
}

/** @param {string} text @param {number} cap */
function capLines(text, cap) {
  const lines = text.split('\n');
  if (lines.length <= cap) return { text, truncated: 0 };
  return {
    text: [...lines.slice(0, cap), `// … ${lines.length - cap} more lines`].join('\n'),
    truncated: lines.length - cap,
  };
}

/** A line that declares one of `names`. @param {string[]} names */
function declarationLine(names) {
  const alternatives = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(
    `^\\s*(?:export\\s+)?(?:default\\s+)?(?:declare\\s+)?(?:abstract\\s+)?(?:async\\s+)?` +
      `(?:function\\*?|class|const|let|var|interface|type|enum|namespace)\\s+(?:${alternatives})(?![\\w$])`
  );
}

const DEFAULT_EXPORT_LINE = /^\s*export\s+default\b/;
const DEFAULT_DECLARED_NAME = /^\s*export\s+default\s+(?:abstract\s+)?(?:async\s+)?(?:class|function\*?)\s+([\w$]+)/;

/**
 * The first line of what leads the declaration at `start`: block comments (back to their
 * opening line), line comments and decorators directly above it.
 * @param {string[]} lines
 * @param {number} start
 * @param {(index: number) => boolean} [usable]  whether a line may be included
 */
function leadingStart(lines, start, usable = () => true) {
  let first = start;
  while (first > 0 && usable(first - 1)) {
    const above = lines[first - 1].trim();
    if (above.endsWith('*/')) {
      let open = first - 1;
      while (open >= 0 && usable(open) && !lines[open].includes('/*')) open--;
      if (open < 0 || !usable(open)) break;
      first = open;
    } else if (above.startsWith('//') || /^@[\w$]/.test(above)) first--;
    else break;
  }
  return first;
}

/**
 * The index of the line that ends the statement starting at `start`: brackets balance and the
 * line does not continue onto the next one. A heuristic for text that does not parse.
 * @param {string[]} lines
 * @param {number} start
 */
export function statementEnd(lines, start) {
  let depth = 0;
  let opened = false;
  let inComment = false;
  /** @type {string | null} */
  let quote = null;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inComment) {
        if (ch === '*' && line[j + 1] === '/') {
          inComment = false;
          j++;
        }
      } else if (quote) {
        if (ch === '\\') j++;
        else if (ch === quote) quote = null;
      } else if (ch === '/' && line[j + 1] === '/') break;
      else if (ch === '/' && line[j + 1] === '*') {
        inComment = true;
        j++;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{' || ch === '(' || ch === '[') {
        depth++;
        opened = true;
      } else if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    if (quote && quote !== '`') quote = null;
    if (depth > 0 || inComment || quote) continue;
    const trimmed = line.trim();
    const next = (lines[i + 1] ?? '').trim();
    const continues = /[=,|&(<:?+-]$/.test(trimmed) || /^(?:[|&.?:]|=>|extends\b|implements\b)/.test(next);
    if (opened && !continues) return i;
    const opensBlock = /^(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|function|enum)\b/.test(
      trimmed
    );
    if (!opened && trimmed && !continues && !opensBlock) return i;
  }
  return lines.length - 1;
}

/**
 * The text of the declaration of `local` in a source file: every top-level statement declaring
 * it with its leading JSDoc, capped at `cap` lines, plus its `@deprecated` note and, for a
 * default export, the name it declares. Unparseable text falls back to a line scan.
 * @param {string} sourceText
 * @param {string} local  local binding name, `default`, or a namespace re-export's name
 * @param {{ file?: string, namespace?: boolean, cap?: number, parsed?: any }} [options]
 */
export function declarationText(
  sourceText,
  local,
  { file = 'module.ts', namespace = false, cap = TEXT_LINE_CAP, parsed } = {}
) {
  /** @type {{ statements: any[], declaredName: string | null }} */
  let found = { statements: [], declaredName: null };
  /** @type {any[]} */
  let comments = [];
  try {
    const result =
      parsed === undefined ? parseSync(file, sourceText, { lang: langOf(file), sourceType: 'module' }) : parsed;
    if (result) {
      comments = result.comments;
      found = findStatements(result.program.body, local, namespace);
    }
  } catch {
    // fall back to the line scan below
  }
  /** @type {string | null} */
  let deprecated = null;
  /** @type {string[]} */
  const parts = [];
  for (const statement of found.statements) {
    /** @type {any} */
    let doc = null;
    for (const c of comments) {
      if (c.end > statement.start) break;
      const isDoc = c.type === 'Block' && sourceText.startsWith('/**', c.start);
      if (isDoc && !sourceText.slice(c.end, statement.start).trim()) doc = c;
    }
    if (doc) deprecated ??= deprecationNote(sourceText.slice(doc.start, doc.end));
    const begin = doc ? doc.start : statement.start;
    parts.push(sourceText.slice(sourceText.lastIndexOf('\n', begin - 1) + 1, statement.end));
  }
  let scanned = false;
  if (!parts.length) {
    const lines = sourceText.split('\n');
    const pattern = local === 'default' ? DEFAULT_EXPORT_LINE : declarationLine([local]);
    const at = lines.findIndex((line) => pattern.test(line));
    if (at !== -1) {
      const first = leadingStart(lines, at);
      const text = lines.slice(first, statementEnd(lines, at) + 1).join('\n');
      parts.push(text);
      const docMatch = /\/\*\*[\s\S]*?\*\//.exec(text);
      if (docMatch) deprecated = deprecationNote(docMatch[0]);
      if (local === 'default') found.declaredName ??= DEFAULT_DECLARED_NAME.exec(lines[at])?.[1] ?? null;
      scanned = true;
    }
  }
  if (!parts.length) return { text: null, truncated: 0, deprecated: null, declaredName: found.declaredName, scanned };
  return { ...capLines(parts.join('\n'), cap), deprecated, declaredName: found.declaredName, scanned };
}

/**
 * The declaring text of a declaration at a version, read with `git show <ref>:<file>`.
 * @param {Context} ctx
 * @param {string} version
 * @param {string} decl
 */
function declarationAt(ctx, version, decl) {
  const { file, local, namespace, specifier } = parseDecl(decl);
  if (!file) return { file: null, text: null, note: `declared outside this repository, in ${specifier}` };
  let sourceText;
  try {
    sourceText = ctx.git(['show', `${refOf(version)}:${file}`]);
  } catch {
    return { file, text: null, note: `${file} does not exist at ${refOf(version)}` };
  }
  const key = `${version}:${file}`;
  if (!ctx.parsed.has(key)) {
    let parsed = null;
    try {
      parsed = parseSync(file, sourceText, { lang: langOf(file), sourceType: 'module' });
    } catch {
      // the line scan in declarationText takes over
    }
    ctx.parsed.set(key, parsed);
  }
  const found = declarationText(sourceText, local, { file, namespace, parsed: ctx.parsed.get(key) });
  return { file, ...found, note: found.text === null ? `no declaration of ${local} found in ${file}` : undefined };
}

// ---------------------------------------------------------------------------------------------
// Evidence

/** `(#1234)` in a commit subject names the pull request. @param {string | null | undefined} subject */
export function prOf(subject) {
  const matches = [...String(subject ?? '').matchAll(/\(#(\d+)\)/g)];
  return matches.length ? `#${matches[matches.length - 1][1]}` : null;
}

/**
 * A Message Batches `custom_id` (`^[a-zA-Z0-9_-]{1,64}$`) for a declaration id: a readable
 * slug and a hash.
 * @param {string} decl
 */
export function customIdFor(decl) {
  const { file, local, specifier } = parseDecl(decl);
  const base =
    local && local !== 'default'
      ? local
      : `${path.basename(file ?? specifier ?? 'decl').replace(/\.[^.]*$/, '')}-default`;
  const slug = base.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 48);
  return `${slug}-${createHash('sha256').update(decl).digest('hex').slice(0, 12)}`;
}

/**
 * A token as the evidence shows it: where it is exported and the facts the ranking reads, with
 * its package, so `compareTokens` can rank these as it ranks tokens.
 * @typedef {{ module: string, export: string, kind: 'value' | 'type', package: string, public: boolean, oldContract: boolean, segments: number, deprecated?: true }} TokenFacts
 */

/** @param {Token} t @returns {TokenFacts} */
function describeToken(t) {
  /** @type {TokenFacts} */
  const out = {
    module: t.module,
    export: t.export,
    kind: t.kind,
    package: t.package,
    public: isPublicModule(t.module),
    oldContract: isOldContract(t.package),
    segments: segmentsOf(t.module),
  };
  if (t.deprecated) out.deprecated = true;
  return out;
}

/** @param {ResidueItem} item @param {Context} ctx */
function historyEntry(item, ctx) {
  const at = item.chain.brokeAt;
  if (!at) return null;
  const entry = ctx.histories[at.index]?.symbols?.[at.id];
  return {
    pair: `${at.from}-${at.to}`,
    id: at.id,
    path: parseDecl(at.id).file,
    recorded: Boolean(entry),
    commit: entry?.commit ?? null,
    subject: entry?.subject ?? null,
    pr: prOf(entry?.subject),
    added: entry?.added?.length ?? 0,
  };
}

/**
 * The commit that removed a declaration `history.symbols` has no entry for: the newest commit
 * `git log -S<name>` finds in the pair where its chain broke (on the file it had there), else in
 * `v<from>..v<to>` on the file it had at `from`.
 * @param {ResidueItem} item
 * @param {Context} ctx
 * @param {string[]} names
 */
function searchRemovingCommit(item, ctx, names) {
  const { local, file } = parseDecl(item.decl);
  const name = local && local !== 'default' ? local : names[0];
  if (!name || !file) return null;
  const searches = [];
  const at = item.chain.brokeAt;
  const fileThen = at && parseDecl(at.id).file;
  if (at && fileThen) searches.push({ range: `${refOf(at.from)}..${refOf(at.to)}`, path: fileThen });
  searches.push({ range: `${refOf(ctx.from)}..${refOf(ctx.to)}`, path: file });
  const tried = new Set();
  for (const search of searches) {
    const key = `${search.range} ${search.path}`;
    if (tried.has(key)) continue;
    tried.add(key);
    let out;
    try {
      out = ctx.git(['log', `-S${name}`, '--format=%h%x09%s', search.range, '--', search.path]);
    } catch {
      continue;
    }
    const line = out.split('\n').find(Boolean);
    if (!line) continue;
    const [commit, ...rest] = line.split('\t');
    const subject = rest.join('\t');
    return { commit, subject, pr: prOf(subject), name, range: search.range, path: search.path };
  }
  return null;
}

/**
 * @param {{ decl: string, via?: string[] }} group
 * @param {Context} ctx
 * @param {ResidueItem} item
 * @param {string | undefined} sourceName
 */
function candidateGroup({ decl, via }, ctx, item, sourceName) {
  const continues = (ctx.continues.get(decl) ?? []).filter((other) => other !== item.decl);
  const tokens = [...(ctx.toIndex.byDecl.get(decl) ?? [])].sort((a, b) =>
    compareTokens(a, b, { sourceName, tieBreak: ctx.tieBreak })
  );
  // a declaration git already continues from another one is shown by name only
  const at = continues.length
    ? { text: null, truncated: 0, note: 'not shown, git continues another declaration with it' }
    : declarationAt(ctx, ctx.to, decl);
  return {
    decl,
    via,
    continues,
    tokens: tokens.map(describeToken),
    shape: ctx.shapes[decl] ?? null,
    text: at.text ?? null,
    truncated: at.truncated || undefined,
    note: at.note,
  };
}

/**
 * The evidence bundle the model sees for one residue declaration: its source tokens, its
 * declaring text at `from` (the statement only, capped at 120 lines) and `@deprecated` note,
 * the `history.symbols` entry where its chain broke (an entry names the commit that removed the
 * binding), else the removing commit `git log -S` finds, and per candidate declaration its
 * tokens (public or private, modern or old contract), its declaring text at `to` and its shape.
 * @param {ResidueItem} item
 * @param {any} ctx  a `buildContext` result; `blind: true` hides git's view (calibration)
 */
export function evidenceFor(item, ctx) {
  const c = withDefaults(ctx);
  const parsed = parseDecl(item.decl);
  const at = declarationAt(c, c.from, item.decl);
  const names = sourceNames(item, [at.declaredName]);
  const sourceName = representative(item.tokens, c.tieBreak)?.export;
  const { groups, omitted } = discover(item, c, names);
  const history = c.blind ? null : historyEntry(item, c);
  const removal = c.blind || history?.recorded ? null : searchRemovingCommit(item, c, names);
  const moved = parsed.file && !c.blind ? chainFile(parsed.file, c.histories) : null;
  return {
    id: customIdFor(item.decl),
    decl: item.decl,
    from: c.from,
    to: c.to,
    blind: c.blind || undefined,
    names,
    source: {
      file: parsed.file,
      external: parsed.specifier ?? undefined,
      tokens: item.tokens.map(describeToken),
      text: at.text ?? null,
      truncated: at.truncated || undefined,
      note: at.note,
      deprecated: at.deprecated ?? (item.tokens.some((t) => t.deprecated) ? '@deprecated' : null),
    },
    chain: c.blind
      ? undefined
      : {
          brokeAt: item.chain.brokeAt ? `${item.chain.brokeAt.from}-${item.chain.brokeAt.to}` : null,
          dangling: item.chain.id,
          returned: item.chain.returned,
        },
    files: moved ? { from: parsed.file, to: moved.files, moved: moved.moved } : undefined,
    history,
    removal,
    candidates: groups.map((group) => candidateGroup(group, c, item, sourceName)),
    omitted,
  };
}

/** @typedef {ReturnType<typeof evidenceFor>} Bundle */

// ---------------------------------------------------------------------------------------------
// The question

/**
 * The system prompt: the task, what a successor is, and the contract's ranking.
 * @param {{ tieBreak?: string[] }} [options]
 */
export function systemPrompt({ tieBreak = DEFAULT_TIE_BREAK } = {}) {
  return [
    'You review how the public exports of WarpDrive (formerly EmberData) moved between releases. A lint rule and a codemod rewrite imports written against an older release so that they point at the export that continues the same declaration in a newer release. Git settles most of these; you get the rest.',
    '',
    'Each request is about one declaration (a class, function, constant or type) that the older release exported and that git could not follow into the newer release: no export of the newer release carries the same declaration after file renames and recorded symbol moves. You see the import paths that exported it, its source at the older release, what git knows about where it went, and candidate exports of the newer release: declarations added by the commit that removed it, declarations with the same or a similar name, and declarations in the file its declaring file moved to, each with its source and its type shape when known.',
    '',
    'Decide which candidate continues the declaration: the same thing renamed or moved, or a direct replacement with the same role that an import rewrite can switch to. Something merely related, a replacement that needs different calling code, or one that covers only part of the old behavior is not a successor; answer null then and name the replacement in the reason. Answer null as well when the declaration was removed without a replacement, for example when a major release dropped deprecated APIs.',
    '',
    'When several candidate exports carry the successor, or several are equally good, pick one by this ranking; the first rule that separates them wins:',
    '1. a public module before a private one (private: a path segment starts with "-", as in "-private");',
    '2. a modern package before an old-contract one (old contract: ember-data and @ember-data/*);',
    '3. fewer path segments in the module name;',
    '4. not deprecated;',
    '5. a value export before a type-only one;',
    '6. the same export name as the old export;',
    `7. a module listed here, in this order: ${tieBreak.join(', ')};`,
    '8. module name, then export name, alphabetical.',
    '',
    'Choose only among the listed candidates and copy module and export exactly. If you believe the real successor is not listed, answer null with a low confidence and name it in the reason.',
    'confidence is your probability that the answer is right. Reserve 0.9 and above for answers the source and the history make plain: matching members or signature, or a commit that states the rename or the removal.',
    'reason is one or two sentences a reviewer can check: cite the commit or pull request, and what matches or what is gone.',
    '',
    `Answer by calling ${TOOL_NAME} exactly once.`,
  ].join('\n');
}

/**
 * The answer's shape. `claude-opus-5-5` rejects a forced `tool_choice`, so `strict` keeps the
 * input schema-valid; strict schemas do not take `minimum`/`maximum`, so 0..1 is checked here.
 */
export const SUCCESSOR_TOOL = {
  name: TOOL_NAME,
  description:
    'Record which candidate export of the newer release continues the declaration, or null when it was removed with no replacement. Call it exactly once.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      choice: {
        description:
          'A listed candidate export, module and export copied exactly, or null when nothing continues the declaration.',
        anyOf: [
          {
            type: 'object',
            properties: {
              module: { type: 'string', description: 'Module specifier, for example @warp-drive/core/store/-private' },
              export: { type: 'string', description: 'Export name, for example LiveArray or default' },
            },
            required: ['module', 'export'],
            additionalProperties: false,
          },
          { type: 'null' },
        ],
      },
      confidence: { type: 'number', description: 'Probability from 0 to 1 that this answer is right.' },
      reason: { type: 'string', description: 'One or two sentences for a reviewer, citing the evidence.' },
    },
    required: ['choice', 'confidence', 'reason'],
    additionalProperties: false,
  },
};

/** @param {TokenFacts} t */
function tokenLine(t) {
  const flags = [
    t.kind,
    t.public ? 'public' : 'private',
    t.oldContract ? 'old contract' : 'modern',
    `${t.segments} segments`,
    ...(t.deprecated ? ['deprecated'] : []),
  ];
  return `\`${t.module}\` exports \`${t.export}\` (${flags.join(', ')})`;
}

/**
 * A code block whose fence is longer than any run of backticks in the text, so a JSDoc example
 * with its own fence cannot close it.
 * @param {string} text
 * @param {string | null | undefined} file
 */
function codeBlock(text, file) {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = '`'.repeat(longest + 1);
  return [`${fence}${/\.[cm]?tsx?$|\.gts$/.test(file ?? '') ? 'ts' : 'js'}`, text, fence];
}

/**
 * The user message for one bundle: the evidence, then the instruction to call the tool.
 * @param {Bundle} bundle
 */
export function renderBundle(bundle) {
  return `${renderEvidence(bundle)}\nCall ${TOOL_NAME} once with your answer.`;
}

/**
 * The evidence of one bundle as text: the declaration, its source, what git knows, and the
 * candidates, numbered. Claude reads it as the user turn and Jev as the state.
 * @param {Bundle} bundle
 */
export function renderEvidence(bundle) {
  const out = [`# Declaration \`${bundle.decl}\``, '', `Exported by ${bundle.from} as:`];
  for (const t of bundle.source.tokens) out.push(`- ${tokenLine(t)}`);
  out.push('');
  if (bundle.source.text) {
    out.push(
      `Source at ${refOf(bundle.from)} (\`${bundle.source.file}\`):`,
      ...codeBlock(bundle.source.text, bundle.source.file),
      ''
    );
  } else out.push(`Source at ${refOf(bundle.from)}: ${bundle.source.note}.`, '');
  const note = bundle.source.deprecated;
  out.push(
    !note
      ? 'Not marked @deprecated.'
      : note === '@deprecated'
        ? 'Marked @deprecated, without a note.'
        : `Marked ${note}`,
    ''
  );

  if (!bundle.blind) {
    out.push('# What git knows', '');
    const { chain, history, removal, files } = bundle;
    for (const r of chain?.returned ?? []) {
      out.push(`- It was gone in ${r.left.replace('-', ' to ')} and came back in ${r.back} under the same id.`);
    }
    if (chain?.brokeAt) {
      out.push(
        `- From ${chain.brokeAt.replace('-', ' to ')}, no export continues this declaration (after file renames and recorded symbol moves), and no later release declares it again.`
      );
    } else if (chain?.dangling) {
      out.push(`- Git follows it to \`${chain.dangling}\`, but no export of ${bundle.to} carries that declaration.`);
    }
    if (files) {
      const where = files.to.length ? files.to.map((f) => `\`${f}\``).join(', ') : 'nowhere (deleted)';
      out.push(
        files.moved
          ? `- Its file \`${files.from}\` became ${where} by ${bundle.to}.`
          : `- Its file \`${files.from}\` did not move.`
      );
    }
    if (history?.recorded) {
      const pr = history.pr ? ` (pull request ${history.pr})` : '';
      const added = history.added
        ? `That commit added ${history.added} exported declarations; the ones that survive to ${bundle.to} are the candidates found by history.`
        : 'That commit added no exported declarations.';
      out.push(
        `- Removed between ${history.pair.replace('-', ' and ')} by ${history.commit} "${history.subject}"${pr}. ${added}`
      );
    } else if (removal) {
      out.push(
        `- Removing commit: ${removal.commit} "${removal.subject}"${removal.pr ? ` (pull request ${removal.pr})` : ''}, from \`git log -S${removal.name} ${removal.range} -- ${removal.path}\`.`
      );
    } else out.push('- No removing commit found.');
    out.push('');
  }

  out.push(`# Candidates in ${bundle.to}`, '');
  if (!bundle.candidates.length) {
    out.push('None: no declaration was found by history, by name, or in the file its declaring file moved to.', '');
  } else if (bundle.blind) {
    out.push(`${bundle.candidates.length} declarations, in no particular order.`, '');
  } else {
    out.push(
      `${bundle.candidates.length} declarations. "Found by" says how: history = added by that commit, followed to ${bundle.to}; name:exact, name:case or name:edit = same name, same name ignoring case, or within two edits; file = declared in the file its declaring file became.`
    );
    const omitted = Object.entries(bundle.omitted ?? {}).map(([source, n]) => `${n} more by ${source}`);
    if (omitted.length) out.push(`Not shown, ranked lower: ${omitted.join(', ')}.`);
    out.push('');
  }
  bundle.candidates.forEach((c, i) => {
    out.push(`## [${i + 1}] \`${c.decl}\``);
    if (c.via?.length) out.push(`Found by: ${c.via.join(', ')}.`);
    if (c.continues.length) {
      out.push(
        `Git already continues ${c.continues.map((d) => `\`${d}\``).join(', ')} of ${bundle.from} with this declaration.`
      );
    }
    out.push('Exports:');
    for (const t of c.tokens) out.push(`- ${tokenLine(t)}`);
    if (c.shape) out.push(`Shape: \`${c.shape}\``);
    if (c.text) out.push(`Source at ${refOf(bundle.to)}:`, ...codeBlock(c.text, c.decl.split('#')[0]));
    else if (c.note) out.push(`Source: ${c.note}.`);
    out.push('');
  });
  return out.join('\n');
}

/**
 * One Message Batches request: `{ custom_id, params }`.
 * @param {Bundle} bundle
 * @param {{ model?: string, effort?: string, tieBreak?: string[], maxTokens?: number }} [options]
 */
export function requestFor(
  bundle,
  { model = JUDGE_MODEL, effort = DEFAULT_EFFORT, tieBreak = DEFAULT_TIE_BREAK, maxTokens = MAX_TOKENS } = {}
) {
  return {
    custom_id: bundle.id,
    params: {
      model,
      max_tokens: maxTokens,
      output_config: { effort },
      system: [{ type: 'text', text: systemPrompt({ tieBreak }), cache_control: { type: 'ephemeral' } }],
      tools: [SUCCESSOR_TOOL],
      tool_choice: { type: 'auto', disable_parallel_tool_use: true },
      messages: [{ role: 'user', content: renderBundle(bundle) }],
    },
  };
}

/**
 * Checks a tool input against the answer's shape.
 * @param {any} input
 * @returns {{ value: { choice: TokenRef | null, confidence: number, reason: string } } | { error: string }}
 */
export function validateAnswer(input) {
  if (!input || typeof input !== 'object') return { error: 'the tool input is not an object' };
  const { choice, confidence, reason } = input;
  const choiceOk =
    choice === null || (choice && typeof choice.module === 'string' && typeof choice.export === 'string');
  if (!choiceOk) return { error: 'choice is neither null nor { module, export }' };
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return { error: 'confidence is not a number' };
  if (typeof reason !== 'string') return { error: 'reason is not a string' };
  return {
    value: {
      choice: choice === null ? null : { module: choice.module, export: choice.export },
      confidence: Math.min(1, Math.max(0, confidence)),
      reason: reason.trim(),
    },
  };
}

/**
 * Reads one line of `messages.batches.results`. Refusals and invalid requests are final; a
 * missing or malformed tool call, an expired or canceled request and a server error can be retried.
 * @param {any} response  `{ custom_id, result }`
 */
export function parseResult(response) {
  const { custom_id, result } = response;
  if (result?.type === 'succeeded') {
    const message = result.message;
    const usage = message.usage;
    if (message.stop_reason === 'refusal') {
      const category = message.stop_details?.category;
      return { custom_id, error: `refusal${category ? ` (${category})` : ''}`, retryable: false, usage };
    }
    const call = (message.content ?? []).find((/** @type {any} */ b) => b.type === 'tool_use' && b.name === TOOL_NAME);
    if (!call) {
      return { custom_id, error: `no ${TOOL_NAME} call (stop_reason ${message.stop_reason})`, retryable: true, usage };
    }
    const checked = validateAnswer(call.input);
    if ('error' in checked) return { custom_id, error: checked.error, retryable: true, usage };
    return { custom_id, ...checked.value, usage };
  }
  if (result?.type === 'errored') {
    const error = result.error?.error ?? result.error ?? {};
    return {
      custom_id,
      error: `${error.type ?? 'error'}: ${error.message ?? 'no message'}`,
      retryable: error.type !== 'invalid_request_error',
    };
  }
  return { custom_id, error: result?.type ?? 'no result', retryable: true };
}

/**
 * Asks Claude about every bundle through the Message Batches API: one request per bundle,
 * `batches.create`, poll `batches.retrieve` until it ends, read `batches.results`. Requests
 * without a usable answer go into one follow-up batch per retry.
 * @param {Bundle[]} bundles
 * @param {{
 *   client: any, model?: string, effort?: string, tieBreak?: string[], pollIntervalMs?: number,
 *   retries?: number, batchId?: string | null, sleep?: (ms: number) => Promise<unknown>,
 *   log?: (line: string) => void, onBatch?: (batch: any, info: { round: number, requests: number }) => void,
 * }} options
 * @returns {Promise<Answer[]>}
 */
export async function askClaude(bundles, options) {
  const {
    client,
    model = JUDGE_MODEL,
    effort = DEFAULT_EFFORT,
    tieBreak = DEFAULT_TIE_BREAK,
    pollIntervalMs = DEFAULT_POLL_SECONDS * 1000,
    retries = 1,
    batchId = null,
    sleep = delay,
    log = () => {},
    onBatch = () => {},
  } = options;
  if (!client) throw new Error('askClaude needs a client');
  const requests = bundles.map((b) => requestFor(b, { model, effort, tieBreak }));
  const ids = new Set(requests.map((r) => r.custom_id));
  /** @type {Map<string, ReturnType<typeof parseResult>>} */
  const results = new Map();
  let pending = requests;
  for (let round = 0; pending.length && round <= retries; round++) {
    let batch =
      round === 0 && batchId
        ? await client.messages.batches.retrieve(batchId)
        : await client.messages.batches.create({ requests: pending });
    onBatch(batch, { round, requests: pending.length });
    log(`judge: batch ${batch.id}, ${pending.length} requests, ${batch.processing_status}`);
    while (batch.processing_status !== 'ended') {
      await sleep(pollIntervalMs);
      batch = await client.messages.batches.retrieve(batch.id);
      const counts = batch.request_counts ?? {};
      log(
        `judge: batch ${batch.id} ${batch.processing_status}: ${counts.processing ?? '?'} processing, ${counts.succeeded ?? '?'} succeeded, ${counts.errored ?? '?'} errored`
      );
    }
    for await (const response of await client.messages.batches.results(batch.id)) {
      if (ids.has(response.custom_id)) results.set(response.custom_id, parseResult(response));
    }
    pending = pending.filter((r) => {
      const answer = results.get(r.custom_id);
      return !answer || (answer.error !== undefined && answer.retryable);
    });
  }
  return bundles.map((b) => {
    /** @type {Record<string, unknown>} */
    const answer = { ...(results.get(b.id) ?? { error: 'no result', retryable: true }) };
    delete answer.custom_id;
    return { decl: b.decl, id: b.id, ...answer };
  });
}

// ---------------------------------------------------------------------------------------------
// Decisions

/**
 * Turns answers into `decisions/<from>.json` entries. An answer below `threshold`, with a
 * `choice` that is not a token of the `to` surface, or with an error is not committed; it goes to
 * the review list with the reasons (`why`).
 * @param {{
 *   residue: Array<{ decl: string, tokens?: Token[], source?: { tokens: any[] }, removal?: any, history?: any, shim?: string | null }>,
 *   answers: Answer[], threshold?: number, toSurface: any, judge?: string, tieBreak?: string[],
 * }} options  `residue` takes residue items or evidence bundles; `toSurface` a surface or its index
 */
export function decide({
  residue,
  answers,
  threshold = DEFAULT_THRESHOLD,
  toSurface,
  judge = JUDGE_MODEL,
  tieBreak = DEFAULT_TIE_BREAK,
}) {
  const toIndex = typeof toSurface?.has === 'function' ? toSurface : indexSurface(toSurface);
  const items = new Map(residue.map((item) => [item.decl, item]));
  /** @type {any[]} */ const entries = [];
  /** @type {any[]} */ const review = [];
  for (const answer of answers) {
    const item = items.get(answer.decl);
    if (!item) continue;
    const tokens = /** @type {Token[]} */ (item.tokens ?? item.source?.tokens ?? []);
    const best = representative(tokens, tieBreak);
    const source = { module: best.module, export: best.export };
    if (answer.error !== undefined) {
      review.push({ decl: item.decl, source, id: answer.id, why: ['error'], error: answer.error });
      continue;
    }
    /** @type {Record<string, unknown>} */
    const entry = {
      decl: item.decl,
      source,
      choice: answer.choice ?? null,
      confidence: Math.round(/** @type {number} */ (answer.confidence) * 100) / 100,
      reason: answer.reason,
      judge,
      reviewed: false,
    };
    if (answer.choice === null) {
      const removedIn = item.removal?.pr ?? item.history?.pr ?? item.removal?.commit ?? item.history?.commit;
      if (removedIn) entry.removedIn = removedIn;
      if (item.shim) entry.shim = item.shim;
    }
    const why = [];
    if (answer.choice && !toIndex.has(answer.choice.module, answer.choice.export)) why.push('choice-not-in-to');
    if (!(/** @type {number} */ (answer.confidence) >= threshold)) why.push('below-threshold');
    if (why.length) review.push({ ...entry, id: answer.id, why });
    else entries.push(entry);
  }
  const byDecl = (/** @type {any} */ a, /** @type {any} */ b) => compareStrings(a.decl, b.decl);
  return { entries: entries.sort(byDecl), review: review.sort(byDecl) };
}

/**
 * Decisions that no longer hold: a `decl` the `from` surface does not have, or a `choice` the
 * `to` surface does not have.
 * @param {{ decisions: any, fromSurface: any, toSurface: any }} options
 * @returns {Array<{ decl: string, problem: string }>}
 */
export function staleDecisions({ decisions, fromSurface, toSurface }) {
  const fromDecls = new Set(tokensOf(fromSurface).map((t) => t.decl));
  const toIndex = indexSurface(toSurface);
  const problems = [];
  for (const entry of decisions.entries ?? []) {
    if (!fromDecls.has(entry.decl)) {
      problems.push({ decl: entry.decl, problem: `not a declaration of surfaces/${decisions.from}.json` });
    }
    if (entry.choice && !toIndex.has(entry.choice.module, entry.choice.export)) {
      problems.push({
        decl: entry.decl,
        problem: `choice ${entry.choice.module} ${entry.choice.export} is not a token of surfaces/${decisions.to}.json`,
      });
    }
  }
  return problems;
}

/**
 * The answers a person or the project thread gave from the dry-run bundles (`--import`),
 * `{ "<decl>": { "choice": { module, export } | null, "confidence": n, "reason": "..." } }`, each
 * checked like a model's tool input; `decide` then applies the threshold and the `to` surface.
 * A declaration that is not residue of the pair, or that already has a decision, is skipped.
 * @param {unknown} doc
 * @param {{ residue: Iterable<string>, decided: Iterable<string> }} options  declaration ids
 * @returns {{ answers: Answer[], skipped: Array<{ decl: string, why: string }> }}
 */
export function importedAnswers(doc, { residue, decided }) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new InputError('the answers are not an object keyed by declaration id');
  }
  const answersByDecl = /** @type {Record<string, unknown>} */ (doc);
  const residueDecls = new Set(residue);
  const decidedDecls = new Set(decided);
  /** @type {Answer[]} */
  const answers = [];
  /** @type {Array<{ decl: string, why: string }>} */
  const skipped = [];
  for (const decl of Object.keys(answersByDecl).sort(compareStrings)) {
    if (decidedDecls.has(decl)) {
      skipped.push({ decl, why: 'already decided; delete its entry to replace it' });
    } else if (!residueDecls.has(decl)) {
      skipped.push({ decl, why: 'not residue of this pair' });
    } else {
      const checked = validateAnswer(answersByDecl[decl]);
      const fields = 'error' in checked ? { error: checked.error, retryable: false } : checked.value;
      answers.push({ decl, id: customIdFor(decl), ...fields });
    }
  }
  return { answers, skipped };
}

/**
 * @typedef {{ decl: string, a: any, b: any }} Side  one declaration's entry in each file, or null
 */

/**
 * Two judges' entries side by side, by declaration: where both answered and chose the same export
 * (or both `removed`), the same declaration through another export, or something else; where
 * only one answered (an entry with an `error` is no answer); and every declaration with an answer
 * below `threshold` in either.
 * @param {any[]} a  decisions entries, review entries or answers
 * @param {any[]} b
 * @param {{ threshold?: number, declOf?: (ref: TokenRef) => string | undefined }} [options]
 *   `declOf` names the declaration of a choice in the `to` surface, when it is at hand
 */
export function compareDecisions(a, b, { threshold = DEFAULT_THRESHOLD, declOf = () => undefined } = {}) {
  const byDecl = (/** @type {any[]} */ list) =>
    new Map(list.filter((e) => e && typeof e.decl === 'string').map((e) => [/** @type {string} */ (e.decl), e]));
  const left = byDecl(a);
  const right = byDecl(b);
  const answered = (/** @type {any} */ e) => Boolean(e) && e.error === undefined && e.choice !== undefined;
  const key = (/** @type {TokenRef | null} */ ref) => (ref ? tokenKey(ref.module, ref.export) : null);
  /** @type {Record<'agree' | 'sameDeclaration' | 'disagree' | 'onlyA' | 'onlyB' | 'low', Side[]>} */
  const out = { agree: [], sameDeclaration: [], disagree: [], onlyA: [], onlyB: [], low: [] };
  for (const decl of [...new Set([...left.keys(), ...right.keys()])].sort(compareStrings)) {
    const side = { decl, a: left.get(decl) ?? null, b: right.get(decl) ?? null };
    const [inA, inB] = [answered(side.a), answered(side.b)];
    if (inA && inB) {
      const [x, y] = [side.a.choice, side.b.choice];
      const declA = x && declOf(x);
      if (key(x) === key(y)) out.agree.push(side);
      else if (declA && y && declA === declOf(y)) out.sameDeclaration.push(side);
      else out.disagree.push(side);
    } else if (inA) out.onlyA.push(side);
    else if (inB) out.onlyB.push(side);
    if ((inA && !(side.a.confidence >= threshold)) || (inB && !(side.b.confidence >= threshold))) out.low.push(side);
  }
  return out;
}

/**
 * Splits a unified diff into hunks of old-side lines (context and removed).
 * @param {string} diffText
 */
function oldSideHunks(diffText) {
  /** @type {Array<Array<{ text: string, removed: boolean }>>} */
  const hunks = [];
  /** @type {Array<{ text: string, removed: boolean }> | null} */
  let hunk = null;
  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git')) hunk = null;
    else if (line.startsWith('@@')) hunks.push((hunk = []));
    else if (!hunk) continue;
    else if (line.startsWith('-')) hunk.push({ text: line.slice(1), removed: true });
    else if (line.startsWith(' ')) hunk.push({ text: line.slice(1), removed: false });
  }
  return hunks;
}

/**
 * The removed declaration of one of `names` in a diff, as code that restores it: its removed
 * lines with their JSDoc, exported, capped at 120 lines. Null when the diff removes none of them.
 * @param {string} diffText  `git show <commit> -- <file>`
 * @param {string[]} names
 * @param {{ isDefault?: boolean, cap?: number }} [options]
 */
export function shimFromDiff(diffText, names, { isDefault = false, cap = TEXT_LINE_CAP } = {}) {
  const pattern = names.length ? declarationLine(names) : null;
  for (const lines of oldSideHunks(diffText)) {
    let start = pattern ? lines.findIndex((l) => l.removed && pattern.test(l.text)) : -1;
    if (start === -1 && isDefault) start = lines.findIndex((l) => l.removed && DEFAULT_EXPORT_LINE.test(l.text));
    if (start === -1) continue;
    const texts = lines.map((l) => l.text);
    const first = leadingStart(texts, start, (i) => lines[i].removed);
    const body = texts.slice(first, statementEnd(texts, start) + 1);
    const at = start - first;
    if (!/^\s*export\b/.test(body[at])) body[at] = `${isDefault ? 'export default' : 'export'} ${body[at].trimStart()}`;
    return capLines(body.join('\n'), cap).text;
  }
  return null;
}

/**
 * Drafts the smallest code that restores a removed token from the commit that removed it
 * (`git show <commit> -- <file>`), for a human to trim.
 * @param {string | { decl: string, tokens?: Array<{ export: string }>, names?: string[] }} decl  a declaration id, residue item or bundle
 * @param {string | { commit: string, path?: string } | null | undefined} removingCommit  a commit, or a bundle's `removal`
 * @param {{ git?: Git, names?: string[] }} [options]
 */
export function shimFor(decl, removingCommit, { git = defaultGit(), names } = {}) {
  const item = typeof decl === 'string' ? { decl, tokens: [] } : decl;
  const { file, local } = parseDecl(item.decl);
  const commit = typeof removingCommit === 'string' ? removingCommit : removingCommit?.commit;
  const where = (typeof removingCommit === 'object' && removingCommit?.path) || file;
  if (!commit || !where) return null;
  let diffText;
  try {
    diffText = git(['show', '--format=', commit, '--', where]);
  } catch {
    return null;
  }
  const isDefault = local === 'default';
  const known = names ?? /** @type {{ names?: string[] }} */ (item).names;
  const wanted = isDefault ? (known ?? sourceNames({ decl: item.decl, tokens: item.tokens ?? [] })) : [local];
  return shimFromDiff(diffText, wanted, { isDefault });
}

// ---------------------------------------------------------------------------------------------
// Calibration

/** @param {string} text */
const shortHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/** How git settled a declaration, in the order calibration samples them. */
export const SETTLED_BY = /** @type {const} */ (['symbols', 'files', 'same']);

/**
 * How git settled a declaration: `symbols` when a `history.symbols` entry gave it its new id on
 * the way, `files` when it only moved with its file, `same` when its id never changed.
 * @param {ResidueItem} item  a settled item
 * @param {{ histories?: Array<{ symbols?: Record<string, { added?: string[] }> }> }} ctx
 * @returns {(typeof SETTLED_BY)[number]}
 */
export function settledBy(item, ctx) {
  const moves = item.chain.moves ?? [];
  if (!moves.length) return 'same';
  const bySymbols = moves.some((m) => (ctx.histories?.[m.index]?.symbols?.[m.from]?.added ?? []).includes(m.to));
  return bySymbols ? 'symbols' : 'files';
}

/**
 * Where a declaration git settled through `history.symbols` would have broken without that
 * entry: the pair whose entry moved it. Calibration starts history there, so its candidates
 * include what the removing commit added, as they would for residue.
 * @param {ResidueItem} item
 * @param {{ diffs: Diff[], histories?: Array<{ symbols?: Record<string, { added?: string[] }> }> }} ctx
 * @returns {Break | null}
 */
function symbolsBreak(item, ctx) {
  const move = (item.chain.moves ?? []).find((m) =>
    (ctx.histories?.[m.index]?.symbols?.[m.from]?.added ?? []).includes(m.to)
  );
  if (!move) return null;
  const diff = ctx.diffs[move.index];
  return { index: move.index, from: diff.from, to: diff.to, id: move.from };
}

/**
 * Blind bundles for the declarations git settles: the true successor is among the candidates
 * (found by name, by file, and through the `history.symbols` entry that moved it, as for
 * residue), nothing says how any candidate was found, git's view is left out, and candidates
 * are in a stable pseudo-random order. Items are taken in turn from each way git settled them
 * (symbols, files, same), each in a stable pseudo-random order, so a `limit` keeps the mix.
 * @param {Context} ctx
 * @param {{ limit?: number }} [options]
 */
export function calibrationBundles(ctx, { limit } = {}) {
  const kinds = SETTLED_BY.map((kind) =>
    ctx.settled
      .filter((item) => settledBy(item, ctx) === kind)
      .sort((a, b) => compareStrings(shortHash(a.decl), shortHash(b.decl)))
  );
  /** @type {ResidueItem[]} */
  const ordered = [];
  for (let i = 0; ordered.length < ctx.settled.length; i++) {
    for (const list of kinds) if (list[i]) ordered.push(list[i]);
  }
  const items = limit ? ordered.slice(0, limit) : ordered;
  const blind = { ...ctx, blind: true };
  /** @type {Record<string, { decl: string, settledBy: string, tokens: TokenRef[], winner: TokenRef }>} */
  const truth = {};
  const bundles = items.map((item) => {
    const successor = /** @type {string} */ (item.chain.id);
    const residueLike = { ...item, chain: { id: null, brokeAt: symbolsBreak(item, ctx) } };
    const bundle = evidenceFor(residueLike, blind);
    if (!bundle.candidates.some((c) => c.decl === successor)) {
      const sourceName = representative(item.tokens, ctx.tieBreak)?.export;
      bundle.candidates.push(candidateGroup({ decl: successor }, blind, item, sourceName));
    }
    for (const c of bundle.candidates) delete c.via;
    bundle.omitted = {};
    bundle.candidates.sort((a, b) =>
      compareStrings(shortHash(`${item.decl} ${a.decl}`), shortHash(`${item.decl} ${b.decl}`))
    );
    const tokens = /** @type {Token[]} */ (ctx.toIndex.byDecl.get(successor));
    const sourceName = representative(item.tokens, ctx.tieBreak)?.export;
    const winner = [...tokens].sort((a, b) => compareTokens(a, b, { sourceName, tieBreak: ctx.tieBreak }))[0];
    truth[bundle.id] = {
      decl: successor,
      settledBy: settledBy(item, ctx),
      tokens: tokens.map((t) => ({ module: t.module, export: t.export })),
      winner: { module: winner.module, export: winner.export },
    };
    return bundle;
  });
  return { bundles, truth };
}

/**
 * Agreement of blind answers with git, per confidence bucket, at or above each threshold, and
 * per way git settled the declaration. `sameDeclaration`: the choice is any export of the true
 * successor; `sameExport`: it is the export the ranking picks among them.
 * @param {Answer[]} answers
 * @param {Record<string, { settledBy?: string, tokens: TokenRef[], winner: TokenRef }>} truth  by bundle id
 * @param {{ edges?: number[] }} [options]
 */
export function agreementReport(answers, truth, { edges = [0.5, 0.7, 0.8, 0.9, 0.95] } = {}) {
  const scored = answers
    .filter((a) => a.error === undefined && truth[a.id])
    .map((a) => {
      const t = truth[a.id];
      const key = a.choice ? tokenKey(a.choice.module, a.choice.export) : null;
      return {
        settledBy: t.settledBy ?? 'unknown',
        confidence: /** @type {number} */ (a.confidence),
        sameDeclaration: Boolean(key && t.tokens.some((x) => tokenKey(x.module, x.export) === key)),
        sameExport: Boolean(key && key === tokenKey(t.winner.module, t.winner.export)),
      };
    });
  const tally = (/** @type {typeof scored} */ list) => ({
    answers: list.length,
    sameDeclaration: list.filter((s) => s.sameDeclaration).length,
    sameExport: list.filter((s) => s.sameExport).length,
  });
  const bounds = [0, ...edges, 1];
  const buckets = bounds.slice(0, -1).map((low, i) => {
    const high = bounds[i + 1];
    const last = i === bounds.length - 2;
    return {
      from: low,
      to: high,
      ...tally(scored.filter((s) => s.confidence >= low && (last ? s.confidence <= high : s.confidence < high))),
    };
  });
  const atOrAbove = edges.map((threshold) => ({
    threshold,
    ...tally(scored.filter((s) => s.confidence >= threshold)),
  }));
  const kinds = [...new Set(scored.map((s) => s.settledBy))].sort(compareStrings);
  const bySettled = Object.fromEntries(kinds.map((kind) => [kind, tally(scored.filter((s) => s.settledBy === kind))]));
  return { answers: answers.length, errors: answers.length - scored.length, buckets, atOrAbove, bySettled };
}

/**
 * Runs the judge blind on the declarations git settles and reports agreement per confidence
 * bucket, so a threshold can be chosen. Writes nothing.
 * @param {{ ctx: Context, ask?: (bundles: Bundle[]) => Promise<Answer[]>, limit?: number }} options
 */
export async function calibrate({ ctx, ask, limit }) {
  const { bundles, truth } = calibrationBundles(ctx, { limit });
  if (!ask) return { bundles, truth, answers: null, report: null };
  const answers = await ask(bundles);
  return { bundles, truth, answers, report: agreementReport(answers, truth) };
}
