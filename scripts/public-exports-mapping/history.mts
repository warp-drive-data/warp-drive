/**
 * `history/<a>-<b>.json`: which source files git saw renamed, copied or deleted between two
 * releases, and for every declaration that no longer has a same-id continuation, the commit
 * that took it away (CONTRACT.md, area B).
 *
 * `files` needs only git. `symbols` also needs both surfaces, because it is computed for the
 * declarations of surface `a` that surface `b` does not continue; without them it is empty,
 * and running again once the surfaces exist fills it in.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseSync } from 'oxc-parser';

import { REPO_ROOT } from './artifacts.mts';
import {
  declarationIds,
  followFiles,
  splitDeclarationId,
  type History,
  type Surface,
  type SymbolMove,
} from './diff.mts';

/**
 * One line of `git diff --name-status`: the status letter, the similarity score of a rename
 * or copy, and its one path (two for a rename or copy: from, to).
 */
export type NameStatus = { status: string; score: number | null; paths: string[] };
export type FileCounts = { renamed: number; copied: number; deleted: number; twins: number };
export type Reader = { exportsOf: (blobs: string[]) => (string[] | null)[] };

/** The directories that hold the packages, in every era. */
export const PACKAGE_ROOTS = ['packages', 'warp-drive-packages'];

/** Rename and copy detection, as CONTRACT.md pins it. */
export const SIMILARITY = ['-M40%', '-C40%'];

/** Length of the abbreviated commit hashes `symbols` records. */
const ABBREV = 10;

/** Source files oxc-parser reads (after `<template>` tags are blanked out). */
const PARSEABLE = /\.(?:[cm]?[jt]s|[jt]sx|g[jt]s)$/;

/**
 * Environment variables that would point git at another repository than the one in `cwd`
 * (they are set inside git hooks, for example).
 */
const REPOSITORY_ENV = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_NAMESPACE',
  'GIT_PREFIX',
];

/**
 * Runs git in `cwd` without a shell. Paths come back unquoted whatever `core.quotePath` says.
 */
export function git(args: string[], options: { cwd: string; input?: string }): string;
export function git(args: string[], options: { cwd: string; input?: string; buffer: true }): Buffer;
export function git(
  args: string[],
  { cwd, input, buffer = false }: { cwd: string; input?: string; buffer?: boolean }
): string | Buffer {
  const env = { ...process.env };
  for (const key of REPOSITORY_ENV) delete env[key];
  try {
    return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
      cwd,
      env,
      input: input === undefined ? undefined : Buffer.from(input),
      encoding: buffer ? 'buffer' : 'utf8',
      maxBuffer: 1 << 30,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? '').trim();
    throw new Error(`git ${args.join(' ')} failed in ${cwd}${stderr ? `:\n${stderr}` : ''}`, { cause: error });
  }
}

/**
 * The revision a version names: its release tag, or `null` for `head`, the working tree.
 */
export function revisionOf(version: string): string | null {
  return version === 'head' ? null : `v${version}`;
}

/**
 * Whether a path is source that a surface can declare something in: it lies under a
 * `src/` or an `addon/` directory.
 */
export function isSourcePath(file: string) {
  return /\/(?:src|addon)\//.test(file);
}

/**
 * Parses the output of `git diff --name-status` (without `-z`, paths unquoted).
 */
export function parseNameStatus(text: string): NameStatus[] {
  const records: NameStatus[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const [code, ...paths] = line.split('\t');
    const status = code.charAt(0);
    const pair = status === 'R' || status === 'C';
    if (
      !/^[ACDMRTUX]\d*$/.test(code) ||
      paths.length !== (pair ? 2 : 1) ||
      paths.some((p) => !p || p.startsWith('"'))
    ) {
      throw new Error(`history: cannot read this line of git diff --name-status: ${JSON.stringify(line)}`);
    }
    records.push({ status, score: code.length > 1 ? Number(code.slice(1)) : null, paths });
  }
  return records;
}

/**
 * The files a deleted file may have become without git seeing a rename, most likely first:
 * its `.ts` twin (`.gts` for `.gjs`), its `src/` twin when it lived under `addon/`, or both.
 */
export function twinsOf(file: string): string[] {
  const typed = (p: string) => p.replace(/\.(g?)js$/, '.$1ts');
  const src = file.replace('/addon/', '/src/');
  return [...new Set([typed(file), src, typed(src)])].filter((twin) => twin !== file);
}

/**
 * The `files` section from `git diff --name-status` records, and how it was decided.
 *
 * Every renamed, copied or deleted path under `src/` or `addon/` maps to the sorted paths that
 * continue it: the targets of its renames and copies, plus itself when it survives next to
 * its copies; `[]` when it was deleted. A deleted file whose twin (`twinsOf`) was added in the
 * same pair counts as renamed to that twin instead.
 */
export function fileMoves(records: NameStatus[]): { files: Record<string, string[]>; counts: FileCounts } {
  const targets: Map<string, Set<string>> = new Map();
  const added = new Set<string>();
  const gone = new Set<string>();
  const deleted: string[] = [];
  const counts = { renamed: 0, copied: 0, deleted: 0, twins: 0 };
  for (const { status, paths } of records) {
    const [from, to] = paths;
    if (status === 'A') added.add(from);
    if (!isSourcePath(from)) continue;
    if (status === 'R' || status === 'C') {
      if (!targets.has(from)) targets.set(from, new Set());
      targets.get(from)?.add(to);
      if (status === 'R') gone.add(from);
      counts[status === 'R' ? 'renamed' : 'copied']++;
    } else if (status === 'D') {
      deleted.push(from);
    }
  }
  for (const [from, set] of targets) if (!gone.has(from)) set.add(from);
  for (const from of deleted) {
    const twin = twinsOf(from).find((candidate) => added.has(candidate));
    targets.set(from, new Set(twin ? [twin] : []));
    counts[twin ? 'twins' : 'deleted']++;
  }
  const files: Record<string, string[]> = {};
  for (const from of [...targets.keys()].sort()) files[from] = [...(targets.get(from) ?? [])].sort();
  return { files, counts };
}

/**
 * `git diff --name-status` from the revision `from` to `to` (the working tree for `null`),
 * limited to the package directories.
 */
function nameStatusBetween(from: string, to: string | null, { cwd }: { cwd: string }) {
  // -l0: rename detection never gives up on a large pair, whatever diff.renameLimit says
  const args = ['diff', '--name-status', '-l0', ...SIMILARITY, from, ...(to ? [to] : []), '--', ...PACKAGE_ROOTS];
  return git(args, { cwd });
}

/**
 * `git diff --name-status` between two releases (the working tree for `head`), limited to the
 * package directories.
 */
export function nameStatus(a: string, b: string, { cwd = REPO_ROOT }: { cwd?: string } = {}) {
  const from = revisionOf(a);
  if (!from) throw new Error('history: head can only be the newer side of a pair');
  return nameStatusBetween(from, revisionOf(b), { cwd });
}

/**
 * The `files` section for a pair, from git.
 */
export function filesBetween(a: string, b: string, { cwd = REPO_ROOT }: { cwd?: string } = {}) {
  return fileMoves(parseNameStatus(nameStatus(a, b, { cwd })));
}

/**
 * Declaration ids named by the paths of some commit, renamed to the paths that continue those
 * files at a later point, through the `files` section (`fileMoves`) of the range in between:
 * a declaration of a renamed file takes the new path, one of a copied file every path that
 * continues it. A file deleted with nothing continuing it keeps its path: no declaration of
 * the later surface has that id, so it is never picked, and it still counts as something the
 * commit added outside that surface (see `continuationOf`).
 * @returns sorted, without duplicates
 */
export function mapForward(ids: string[], files: Record<string, string[]>): string[] {
  const forward: Set<string> = new Set();
  for (const id of ids) {
    const { file, name } = splitDeclarationId(id) as { file: string; name: string };
    const paths = followFiles(files, file);
    for (const path of paths.length ? paths : [file]) forward.add(`${path}#${name}`);
  }
  return [...forward].sort();
}

function langOf(filename: string): 'js' | 'jsx' | 'ts' | 'tsx' | 'dts' {
  if (filename.endsWith('.d.ts')) return 'dts';
  if (/\.[cm]?ts$|\.gts$/.test(filename)) return 'ts';
  if (filename.endsWith('.tsx')) return 'tsx';
  if (filename.endsWith('.jsx')) return 'jsx';
  return 'js';
}

/**
 * Whether `before`, the source preceding a `<template>` tag, leaves the tag inside a class body.
 * Counts braces without reading strings or comments, which is enough for component files.
 */
function insideClassBody(before: string) {
  let depth = 0;
  for (let i = before.length - 1; i >= 0; i--) {
    if (before[i] === '}') depth++;
    else if (before[i] === '{' && depth-- === 0) return /\bclass\b[^{};]*$/.test(before.slice(0, i));
  }
  return false;
}

/**
 * Replaces the `<template>` tags of a `.gjs`/`.gts` file, which oxc-parser cannot read, with
 * code of the same shape: an expression, a class member, or (at the top level) the module's
 * default export, as content-tag compiles them. Line breaks are kept.
 */
export function withoutTemplateTags(filename: string, source: string) {
  if (!/\.g[jt]s$/.test(filename)) return source;
  return source.replace(/<template>[\s\S]*?<\/template>/g, (tag, offset: number) => {
    const before = source.slice(0, offset);
    const lines = '\n'.repeat(tag.split('\n').length - 1);
    if (/(?:[=(,:?[!&|]|=>|\breturn|\bdefault|\byield|\bawait)\s*$/.test(before)) return `0${lines}`;
    return insideClassBody(before) ? `static {}${lines}` : `export default 0;${lines}`;
  });
}

/**
 * The bindings a file declares and exports, by local name (`default` for its default
 * export), sorted. Re-exports and exported imports are declared elsewhere and left out.
 */
export function declaredExports(filename: string, source: string): string[] {
  const { module } = parseSync(filename, withoutTemplateTags(filename, source), { lang: langOf(filename) });
  const imported = new Set(module.staticImports.flatMap((s) => s.entries.map((entry) => entry.localName.value)));
  const names = new Set<string>();
  for (const statement of module.staticExports) {
    for (const entry of statement.entries) {
      if (entry.moduleRequest) continue;
      // `kind` is typed as an ambient const enum, which type stripping cannot inline
      if (String(entry.exportName.kind) === 'Default' || entry.exportName.name === 'default') {
        names.add('default');
      } else if (entry.localName.name && !imported.has(entry.localName.name)) {
        names.add(entry.localName.name);
      }
    }
  }
  return [...names].sort();
}

/**
 * Whether a path holds source a surface can declare something in and oxc-parser can read.
 */
function isDeclaringPath(file: string) {
  return PACKAGE_ROOTS.some((root) => file.startsWith(`${root}/`)) && isSourcePath(file) && PARSEABLE.test(file);
}

/**
 * The contents of blobs by `<revision>:<path>` name, from one `git cat-file --batch`. Names
 * that do not resolve to a blob are absent from the result.
 */
function readBlobs(names: string[], { cwd }: { cwd: string }): Map<string, string> {
  const blobs: Map<string, string> = new Map();
  if (!names.length) return blobs;
  const out = git(['cat-file', '--batch'], { cwd, input: `${names.join('\n')}\n`, buffer: true });
  let offset = 0;
  for (const name of names) {
    const eol = out.indexOf(10, offset);
    const header = out.toString('utf8', offset, eol);
    offset = eol + 1;
    if (/ (?:missing|ambiguous)$/.test(header)) continue;
    const [, type, size] = header.split(' ');
    if (type === 'blob') blobs.set(name, out.toString('utf8', offset, offset + Number(size)));
    offset += Number(size) + 1;
  }
  return blobs;
}

/**
 * Reads `declaredExports` of `<revision>:<path>` blobs, each one parsed once per reader.
 */
function readerFor({ cwd }: { cwd: string }): Reader {
  const cache: Map<string, string[] | null> = new Map();
  return {
    exportsOf(names) {
      const fresh = names.filter((name) => !cache.has(name));
      const blobs = readBlobs(fresh, { cwd });
      for (const name of fresh) {
        const source = blobs.get(name);
        cache.set(name, source === undefined ? null : declaredExports(name.slice(name.indexOf(':') + 1), source));
      }
      return names.map((name) => cache.get(name) ?? null);
    },
  };
}

/**
 * The declaration ids a commit added: for every source file it touched, the bindings the file
 * declares and exports after the commit and did not before it, as `<path>#<name>`, sorted.
 * @param commit  a full hash
 */
export function addedDeclarations(
  commit: string,
  { cwd, reader = readerFor({ cwd }) }: { cwd: string; reader?: Reader }
): string[] {
  const touched = git(['diff-tree', '-r', '--root', '--no-renames', '--no-commit-id', '--name-only', '-z', commit], {
    cwd,
  })
    .split('\0')
    .filter((file) => file && isDeclaringPath(file));
  const after = reader.exportsOf(touched.map((file) => `${commit}:${file}`));
  const before = reader.exportsOf(touched.map((file) => `${commit}^:${file}`));
  const added: string[] = [];
  touched.forEach((file, i) => {
    const previous = new Set(before[i] ?? []);
    for (const name of after[i] ?? []) if (!previous.has(name)) added.push(`${file}#${name}`);
  });
  return added.sort();
}

/**
 * `addedDeclarations` of a commit, mapped forward (`mapForward`) to `to`, the working tree for
 * `null`, through the renames, copies and twins git sees from the commit to `to`, found the
 * way `files` finds them for a pair.
 * @param commit  a full hash
 */
function addedAsOf(commit: string, to: string | null, { cwd, reader }: { cwd: string; reader: Reader }): string[] {
  const added = addedDeclarations(commit, { cwd, reader });
  if (!added.length) return added;
  return mapForward(added, fileMoves(parseNameStatus(nameStatusBetween(commit, to, { cwd }))).files);
}

/**
 * Whether `commit` took the binding `name` out of `paths`: before it one of them declared and
 * exported the binding, after it none does.
 */
function removes(commit: string, paths: string[], name: string, reader: Reader) {
  const exported = (revision: string) =>
    reader.exportsOf(paths.map((file) => `${revision}:${file}`)).some((names) => names?.includes(name));
  return exported(`${commit}^`) && !exported(commit);
}

/**
 * Refuses a range that a shallow clone cuts: its commits would show the whole tree as added.
 * @param range  `<from>..<to>`
 */
function assertFullHistory(range: string, { cwd }: { cwd: string }) {
  if (git(['rev-parse', '--is-shallow-repository'], { cwd }).trim() !== 'true') return;
  const shallowFile = git(['rev-parse', '--path-format=absolute', '--git-path', 'shallow'], { cwd }).trim();
  const boundary = new Set(readFileSync(shallowFile, 'utf8').split('\n').filter(Boolean));
  const cut = git(['rev-list', range], { cwd })
    .split('\n')
    .find((commit) => boundary.has(commit));
  if (cut) {
    throw new Error(
      `history: ${range} reaches the edge of this shallow clone at ${cut.slice(0, ABBREV)}; ` +
        'symbols need the whole range (git fetch --unshallow)'
    );
  }
}

/**
 * The declarations of `surfaceA` that `surfaceB` does not continue through `files`: those
 * whose id, with the declaring file followed through `files`, `surfaceB` does not reference.
 * External ids and namespace re-exports name nothing git can search for and are left out.
 */
export function discontinued(files: Record<string, string[]>, surfaceA: Surface, surfaceB: Surface): string[] {
  const inB = new Set(declarationIds(surfaceB));
  return declarationIds(surfaceA).filter((id) => {
    const parsed = splitDeclarationId(id);
    if (!parsed || parsed.name.startsWith('*')) return false;
    return !followFiles(files, parsed.file).some((file) => inB.has(`${file}#${parsed.name}`));
  });
}

/**
 * The `symbols` section. For every declaration `discontinued` returns, `git log -S<name>` over
 * `v<a>..v<b>` and the declaring file plus the files continuing it lists the commits that
 * changed how often the name occurs there; the newest of them that removed the declaration
 * (the files exported the binding before it and none does after it) is recorded, with the
 * declarations it added, named by the paths their files have at `b` (`addedAsOf`). A default
 * export is searched by the text that goes away with it, `export default` or `as default`.
 * Declarations no commit removed are left out.
 */
export function symbolMoves(
  a: string,
  b: string,
  files: Record<string, string[]>,
  surfaceA: Surface,
  surfaceB: Surface,
  { cwd = REPO_ROOT }: { cwd?: string } = {}
): Record<string, SymbolMove> {
  const pending = discontinued(files, surfaceA, surfaceB);
  if (!pending.length) return {};
  const from = revisionOf(a);
  const to = revisionOf(b);
  const range = `${from}..${to ?? 'HEAD'}`;
  assertFullHistory(range, { cwd });
  const reader = readerFor({ cwd });
  const addedBy: Map<string, string[]> = new Map();
  const symbols: Record<string, SymbolMove> = {};
  for (const id of pending) {
    const { file, name } = splitDeclarationId(id) as { file: string; name: string };
    let needle = name;
    if (name === 'default') {
      const source = readBlobs([`${from}:${file}`], { cwd }).get(`${from}:${file}`) ?? '';
      needle = !source.includes('export default') && source.includes('as default') ? 'as default' : 'export default';
    }
    const paths = [...new Set([file, ...followFiles(files, file)])];
    const log = git(
      [
        '--literal-pathspecs',
        'log',
        '--no-show-signature',
        '--no-textconv',
        `-S${needle}`,
        '--format=%H%x09%s',
        range,
        '--',
        ...paths,
      ],
      { cwd }
    );
    const removal = log
      .split('\n')
      .filter(Boolean)
      .map((line) => ({ commit: line.slice(0, line.indexOf('\t')), subject: line.slice(line.indexOf('\t') + 1) }))
      .find(({ commit }) => removes(commit, paths, name, reader));
    if (!removal) continue;
    const { commit, subject } = removal;
    if (!addedBy.has(commit)) addedBy.set(commit, addedAsOf(commit, to, { cwd, reader }));
    symbols[id] = { commit: commit.slice(0, ABBREV), subject, added: addedBy.get(commit) ?? [] };
  }
  return symbols;
}

/**
 * The history object for the pair `a`-`b` (`b` may be `head`). Without both surfaces only
 * `files` is computed and `symbols` is empty.
 */
export function historyOf(
  a: string,
  b: string,
  {
    surfaceA = null,
    surfaceB = null,
    cwd = REPO_ROOT,
  }: { surfaceA?: Surface | null; surfaceB?: Surface | null; cwd?: string } = {}
): History {
  if (surfaceA && surfaceA.version !== a) {
    throw new Error(`history ${a}-${b}: the surface given for ${a} is the surface of ${surfaceA.version}`);
  }
  if (surfaceB && surfaceB.version !== b) {
    throw new Error(`history ${a}-${b}: the surface given for ${b} is the surface of ${surfaceB.version}`);
  }
  const { files } = filesBetween(a, b, { cwd });
  const symbols = surfaceA && surfaceB ? symbolMoves(a, b, files, surfaceA, surfaceB, { cwd }) : {};
  return { schema: 1, kind: 'history', from: a, to: b, files, symbols };
}
