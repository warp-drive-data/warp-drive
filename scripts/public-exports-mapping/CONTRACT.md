# Public exports mapping: data contract

This directory derives, per released version of this repository, what every public package
exports, how those exports moved between releases, and from that the import rewrites that
`no-legacy-imports` in `eslint-plugin-warp-drive` (and later a codemod) apply. Several people
build the parts in parallel, so this file pins the file formats and the rules every part must
agree on. When this file and a part disagree, this file wins; change this file first.

Status: implementation contract. README.md and INTENTION.md replace it once the parts land.

## Releases

`releases.json` lists the covered versions, oldest first. Each is the latest patch of a minor
that removed or moved a public export (plus the latest minor), and its git tag is `v<version>`:

```json
{ "schema": 1, "baseline": "4.12.8", "releases": ["4.12.8", "5.0.1", "5.4.1", "5.5.0", "5.6.0", "5.7.0", "5.8.2", "5.9.1"] }
```

The working tree is the version `head`; its `major.minor` comes from the root `package.json`.
Consecutive entries form the pairs `4.12.8-5.0.1`, `5.0.1-5.4.1`, ..., `5.9.1-head`.

## Layout and ownership

```
scripts/public-exports-mapping/
  CONTRACT.md       this file
  releases.json     covered versions
  artifacts.mjs     canonical JSON, write/check helpers, repo paths        (shared, exists)
  cli.mjs           `node scripts/public-exports-mapping/cli.mjs <command> ...`; loads commands/*.mjs
  commands/*.mjs    one file per command: `export const name`, `export const describe`, `export async function run(argv, context)`
  resolver.mjs      oxc-resolver configured for a source tree                          area A
  exports.mjs       what one source file exports, from the oxc-parser module record     area A
  worktrees.mjs     a git worktree per release tag, disposed after use                  area A
  surface.mjs       entry discovery per era; `surfaces/<version>.json`                  area A
  history.mjs       file renames and symbol moves between two releases, from git        area B
  diff.mjs          `diffs/<a>-<b>.json` from two surfaces and a history                area B
  published.mjs     the package as published on npm, from a cached tarball              area C
  audit.mjs         surface vs published package; `audits/<version>.json`, `shapes/`    area C
  map.mjs           the stages and the ranking; a map for any (from, to)                area D
  ship.mjs          writes the plugin's data directory                                  area D
  judge.mjs         evidence bundles, the Claude judge, `decisions/<from>.json`         area E
  surfaces/  history/  diffs/  audits/  shapes/  decisions/  preferences.json           data
packages/eslint-plugin-warp-drive/src/legacy-import-mapping/                            area D
  index.js index.d.ts   the reader: loadMap({ from, to }).resolve(module, name, { typeOnly })
  releases.json  surface.4.12.8.json  diffs/*.json  decisions/*.json  preferences.json  messages.json
packages/eslint-plugin-warp-drive/src/rules/no-legacy-imports.{js,md}                   area D
scripts/__tests__/public-exports-mapping-<area>.spec.mjs                                each area
scripts/__tests__/fixtures/public-exports-mapping/<area>/                               each area
```

Each area edits only its own files, its command modules and its spec. A need for a change in
another area's file is a note in the commit message, not an edit.

## Rules every part follows

- Node ESM, `.mjs`, JSDoc types, no TypeScript compile step. No `typescript` import anywhere in
  this directory: parsing is `oxc-parser`, resolving is `oxc-resolver`.
- New dependencies go into `pnpm-workspace.yaml` under `catalog:` and into the root
  `package.json` `devDependencies` as `catalog:`. Allowed: `oxc-parser`, `oxc-resolver`,
  `@anthropic-ai/sdk`. Nothing else without a reason in the commit message.
- Locally this container runs node 22 and `pnpm install --ignore-scripts --frozen-lockfile`
  works (about 30 s); after adding a dependency use `--no-frozen-lockfile`. Workspace packages
  are injected but not built. CI is the source of truth; run what you can locally, and say in
  the commit message what you could not run.
- Tests: `node --test scripts/__tests__/public-exports-mapping-<area>.spec.mjs`; `pnpm
  test:scripts` runs them all. A test never shells out to the network; `published.mjs` tests use
  a fixture tarball.
- Every JSON artifact is written through `artifacts.mjs`: keys sorted, two-space indent,
  trailing newline, no dates, tool versions or absolute paths inside, so a regeneration that
  changes nothing produces the same bytes. Every command takes `--check`: it computes the same
  files in memory, prints each file that would change, writes nothing, exits 1 on a difference.
- Module and export names, declaration ids and paths are repo-relative and POSIX.
- Commits: Conventional Commits (`feat(scripts): ...`, `chore(scripts): ...`, `test(scripts): ...`),
  imperative subject, no trailing period, a body that says what and why. No agent or model
  byline, no `Co-Authored-By` naming an AI, no session links: the repository's contributor rule
  `warp-drive-packages/memory-alpha/skills/contributors/keep-commits-human-authored.md` applies.
- Commit on your own branch in your own worktree. Do not push, rebase, or run git in another
  worktree.

## Identity

A token is `(module, export)`. A module is a bare import specifier a consumer can write
(`@ember-data/store`, `@ember-data/store/-private`, `ember-data/model`, `@warp-drive/core/store`).
An export name is the exported binding, `default` included.

Every export carries a declaration id, `decl`: the repo-relative path of the file that declares
the binding, `#`, and the local binding name in that file, for example
`warp-drive-packages/core/src/store/-private/store-service.ts#Store`. A default export's id ends
in `#default` whatever its local name. A re-export (`export { a as b } from './x'`,
`export * from './x'`, `import { a } from './x'; export { a }`) resolves through the chain to
the declaring file. A declaration that resolves outside the tree (an npm dependency, a
`@embroider/macros` import) gets `external:<specifier>#<name>`. A namespace re-export
(`export * as ns from`) gets `<file>#*ns`.

`kind` is `value` when a runtime binding exists and `type` when the export is type-only
(`export type`, an interface, a type alias, `export declare class`). A value and a type under one
name are one export of kind `value`.

Within one tree, declaration ids come from `oxc-resolver` (area A). Across trees they are
chained by git (area B): a file rename or copy between two release tags maps
`<old file>#<name>` to `<new file>#<name>`; a symbol that left its file maps through the commit
that removed it. Two tokens are "the same declaration" when their ids match after chaining.

## Modules per era

Entry files, from which module names derive, come from the build config of the package at that
tag (area A), checked against the published package where one exists (area C):

| Era | Source of entries | Module name |
| --- | --- | --- |
| 4.12 to 5.4, `packages/*/rollup.config.mjs` | `addon.publicEntrypoints([...])`, patterns relative to `src/` | `<pkg>/<entry without extension>`, `index` dropped |
| 4.12, v1 addons (`ember-data` meta package, no build config) | every `.js`/`.ts` under `addon/` | `<pkg>/<path under addon/ without extension>`, `index` dropped |
| 5.5 to 5.8, `vite.config.mjs` | `export const entryPoints = [...]`, globs relative to the package | same |
| 5.9+, `tsdown.config.mjs` | `export const entryPoints = [...]` | same |
| 5.4+, `package.json#exports` | subpath keys; a pattern key expands against the entry outputs | the key with `./` dropped |

Private packages (`"private": true`) are skipped. A module is public unless any path segment is
`-private` or starts with `-`; it is "old contract" when its package is `ember-data` or
`@ember-data/*`. `@warp-drive/legacy/*` is modern.

## Files

### `surfaces/<version>.json` (area A)

```json
{
  "schema": 1, "kind": "surface", "version": "5.9.1", "tag": "v5.9.1",
  "packages": { "@ember-data/store": { "dir": "packages/store", "modules": ["@ember-data/store", "@ember-data/store/-private"] } },
  "modules": {
    "@ember-data/store": {
      "package": "@ember-data/store",
      "entry": "packages/store/src/index.ts",
      "forward": null,
      "exports": {
        "default": { "kind": "value", "decl": "warp-drive-packages/core/src/store/-private/store-service.ts#Store" },
        "CachePolicy": { "kind": "type", "decl": "warp-drive-packages/core/src/store/-private/store-service.ts#CachePolicy" },
        "recordIdentifierFor": { "kind": "value", "decl": "warp-drive-packages/core/src/store/-private/caches/instance-cache.ts#recordIdentifierFor", "deprecated": true }
      }
    }
  }
}
```

`forward` is the specifier when the entry file's only statements are `export *` (and
`export type *`) of one specifier, else `null`. `deprecated` appears only when the declaring
statement's leading JSDoc carries `@deprecated`. `version` is `head` for the working tree, with
`tag` null.

### `history/<a>-<b>.json` (area B)

```json
{
  "schema": 1, "kind": "history", "from": "5.5.0", "to": "5.6.0",
  "files": {
    "packages/store/src/-private/store-service.ts": ["warp-drive-packages/core/src/store/-private/store-service.ts"],
    "packages/model/src/-private/attr.js": ["packages/model/src/-private/attr.ts"],
    "packages/store/src/-private/gone.ts": []
  },
  "symbols": {
    "packages/store/src/-private/caches/instance-cache.ts#isStableIdentifier": {
      "commit": "a33e76412e", "subject": "chore: improve isDocumentIdentifier and isRecordIdentifier checks (#10068)",
      "added": ["warp-drive-packages/core/src/store/-private/caches/instance-cache.ts#isResourceKey"]
    }
  }
}
```

`files` comes from `git diff --name-status -M40% -C40% v<a> v<b> -- packages warp-drive-packages`
(for `head`, against the working tree), keyed by old paths under `src/` or `addon/`, plus the
heuristic that a deleted file whose `.ts` twin (or `src/` twin of an `addon/` file) was added in
the same pair is a rename. A copy whose source survives lists the source first:
`old -> [old, copy]`. Git runs with `-l0`, `core.quotePath=false`, `--literal-pathspecs`,
`--no-textconv`, `--no-show-signature` and a cleared git environment, so `cwd` alone decides the
repository.

`symbols` has one entry per declaration of surface `a` that has no same-id declaration in surface
`b` after `files`, when a commit in `v<a>..v<b>` removed that exported binding from its file: the
newest `git log -S` hit that, by parsing the file before and after, really removed the binding (a
hit that only touched a comment or a usage does not count; a default export is searched as
`export default` or `as default`, not by its local name). The entry carries the abbreviated hash
(10 characters), the subject, and `added`: the exported declarations that commit added in the
files it touched, with their ids mapped forward through later renames in the range so they name
paths of `v<b>`. Nothing removed means no entry. `history` needs the full commit range: a shallow
clone makes it throw, so CI checks out full history with tags (`fetch-depth: 0`).

### `diffs/<a>-<b>.json` (area B)

```json
{
  "schema": 1, "kind": "diff", "from": "5.5.0", "to": "5.6.0",
  "packages": {
    "added": { "@warp-drive/core": { "dir": "warp-drive-packages/core", "modules": ["@warp-drive/core", "@warp-drive/core/store"] } },
    "removed": ["@ember-data/private-build-infra"],
    "changed": { "@ember-data/store": { "modules": ["@ember-data/store", "@ember-data/store/-private", "@ember-data/store/types"] } }
  },
  "modules": {
    "added": { "@warp-drive/core": { "package": "@warp-drive/core", "entry": "warp-drive-packages/core/src/index.ts", "forward": null } },
    "removed": ["@warp-drive/core-types/schema/fields.type-test"],
    "changed": { "@ember-data/store": { "forward": "@warp-drive/core" } }
  },
  "exports": {
    "@ember-data/store": {
      "added": { "setKeyInfoForResource": { "kind": "value", "decl": "warp-drive-packages/core/src/store/-private/caches/cache-utils.ts#setKeyInfoForResource" } },
      "removed": ["normalizeModelName"],
      "changed": { "ConfiguredStore": { "kind": "type" } }
    }
  },
  "declarations": {
    "packages/store/src/-private/store-service.ts#Store": "warp-drive-packages/core/src/store/-private/store-service.ts#Store",
    "packages/store/src/-private/caches/instance-cache.ts#isStableIdentifier": "warp-drive-packages/core/src/store/-private/caches/instance-cache.ts#isResourceKey",
    "packages/adapter/src/error.ts#errorsArrayToHash": null
  }
}
```

A diff is complete: applying `packages`, `modules` and `exports` to surface `a` reproduces
surface `b` exactly, `version` and `tag` coming from `to`; `diffSurfaces` refuses to return a
diff for which that does not hold. A `changed` record carries every attribute that differs. For
an optional attribute (`deprecated`) the value `null` means "absent in `b`"; for an attribute
that is always present (`package`, `entry`, `forward`, `kind`, `decl`, `dir`, `modules`) `null`
is the value itself.

`declarations` maps every declaration id of surface `a` to its id in surface `b`, or `null` when
nothing in `b` continues it. An id continues through `files` first. Otherwise its `symbols` entry
decides, in this order: an `added` declaration with the same local name; for a default export, the
one declaration the commit added in the same file (default turned named); the single `added`
declaration of the same kind, but only when the commit added nothing outside surface `b` and
removed no other declaration of that kind that would land on the same target. Anything else maps
to `null`, and the judge (area E) decides.

### `audits/<version>.json` and `shapes/<version>.json` (area C)

The published package at the version the tag's `package.json` names (`npm pack` into a cache
directory outside the repository, keyed by name and version). `audits/<version>.json` records,
per package: the `exports` map, every `exports` target that does not ship, and per module the
runtime export names (from `oxc-parser` over `dist/*.js`) and the type names (from the `.d.ts`),
followed by the differences against `surfaces/<version>.json`: a module the surface has and the
package does not ship, a token the package has and the surface lacks (and the reverse), and a
`kind` that disagrees. For 4.12, a v1 addon tarball's `addon/` tree is its module list.
`shapes/<version>.json` maps each declaration id to one string: the declaration's signature or
member list as the `.d.ts` prints it, for the judge's evidence. A package unpublished at that
version is recorded as such, not an error.

### `decisions/<from>.json` (area E, read by D)

```json
{
  "schema": 1, "kind": "decisions", "from": "4.12.8", "to": "5.9.1",
  "entries": [
    {
      "decl": "packages/store/src/-private/record-arrays/identifier-array.ts#IdentifierArray",
      "source": { "module": "@ember-data/store/-private", "export": "IdentifierArray" },
      "choice": { "module": "@warp-drive/core/store/-private", "export": "LiveArray" },
      "confidence": 0.93, "reason": "Same class renamed in #9965; members and constructor match.",
      "judge": "claude-opus-5-5", "reviewed": false
    },
    {
      "decl": "packages/adapter/src/error.ts#errorsArrayToHash",
      "source": { "module": "@ember-data/adapter/error", "export": "errorsArrayToHash" },
      "choice": null, "removedIn": "#8550",
      "shim": "export function errorsArrayToHash(errors) {\n  // ...\n}",
      "confidence": 0.98, "reason": "Deleted with the 4.x deprecations in #8550; nothing took its place.",
      "judge": "claude-opus-5-5", "reviewed": false
    }
  ]
}
```

`choice` names a token of the `to` surface or is `null` for "removed, no replacement". `shim`
is the smallest code that restores a removed token, drafted from the removing commit's diff
for a human to trim. `reviewed` flips to `true` by hand. Decisions are keyed by `decl` so they
survive a module rename; a decision whose `decl` is not in the `from` surface, or whose
`choice` is not in the `to` surface, is stale and fails `--check`.

### `preferences.json` (shared, area D writes it)

```json
{ "schema": 1, "audience": "ember", "tieBreak": ["@warp-drive/ember"],
  "report": { "ember-data/store": "side-effect", "ember-data": "side-effect" } }
```

## Stages and ranking (area D, using A, B, E data)

For one token of the `from` surface with declaration `d`:

1. Follow `declarations` through the diffs from `from` to `to`, pair by pair. When a pair maps
   the current id to `null`, look the id up verbatim in the surfaces of the later releases up
   to `to`, in order; the first surface that declares it resumes the chain from there (4.12
   carried backports that 5.0 lacks and 5.4 has again under the same id). `d'` is the id
   reached at `to`, or `null`.
2. Candidates: every token of the `to` surface whose `decl` is `d'`.
3. No candidates and a decision for `d` in `decisions/<from>.json`: its `choice` (or removed).
4. No candidates and no decision: the token is unresolved; it reports `removed` and `judge`
   lists it as residue.

Rank candidates, first rule that separates wins:

1. a public module before a `-private` one;
2. a modern package before an old-contract one;
3. fewer path segments;
4. not `deprecated`;
5. `kind` `value` before `type`;
6. the same export name as the source;
7. a module in `preferences.tieBreak`, in that order;
8. module name, then export name, alphabetical.

The decision for an import of `(module, name)` written against `from`:

- module not in the `from` surface: `keep`;
- module in `preferences.report`: `report` with that reason;
- name not in the module: `report untracked`, unless the module's `forward` at `to` names a
  module, then `rewrite` to `(forward, name)`;
- no candidate: `report removed` (with `removedIn` and `shim` when a decision carries them);
- winner is the same `(module, name)`: `keep`;
- a value import and the winner is `kind` `type`: `report type-only`;
- winner in a `-private` module: `rewrite` with `reason: 'private-target'`;
- otherwise `rewrite`.

## Reader (area D)

`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/index.js`:

```js
import { loadMap, listReleases } from 'eslint-plugin-warp-drive/legacy-import-mapping';
const map = loadMap({ from: '4.12', to: '5.9' });   // minors; patch resolved from releases.json
map.resolve('@ember-data/store', 'default', { typeOnly: false });
// -> { action: 'rewrite', to: { module: '@warp-drive/core', export: 'Store' }, reason?: 'private-target' }
// -> { action: 'report', reason: 'removed' | 'untracked' | 'type-only' | 'side-effect', removedIn?, shim?, links? }
// -> { action: 'keep' }
```

`from` defaults to the baseline; `to` defaults to the installed `@warp-drive/core` version's
minor, else the newest release. The reader rebuilds the `to` surface by applying the shipped
diffs to the shipped baseline surface, once per `(from, to)`, and never calls the network or a
model. The rule applies the decision; message ids are
`warp-drive.no-legacy-imports` (rewrite), `...private-target`, `...removed`, `...untracked`,
`...type-only-target`, `...side-effect`. `messages.json` carries the links a `side-effect` or
`removed` message prints (the in-place upgrade guide, the API docs, the request service cheat
sheet).

## Commands

```
cli.mjs surface <version|head> [--check]        area A
cli.mjs history <a> <b> [--check]               area B
cli.mjs diff <a> <b> [--check]                  area B
cli.mjs audit <version> [--check]               area C
cli.mjs judge --from <v> [--to <v>] [--dry-run] [--judge claude|jev]   area E
cli.mjs ship [--check]                          area D
cli.mjs update [--check]                        area A: surface head, then history/diff 5.9.1-head and ship when those commands exist
cli.mjs release <version>                       area A: surface + history + diff + audit for a newly tagged version, then ship
```

`cli.mjs` discovers `commands/*.mjs`; a command module that is missing is reported as "not
implemented yet" (exit 2) rather than failing the loader. Area A writes `cli.mjs` and the loader;
every other area adds only its own `commands/<name>.mjs`.

A command exports `run(argv, context)`: `argv` is the argument list after the command name,
`context` is `{ dataRoot, cwd }` with defaults of the data directory and `process.cwd()` (tests
pass a temp directory). `run` resolves to the process exit code and throws on a usage error or
a missing input; the loader prints the error message and exits 1. `console` output belongs in
`commands/*.mjs` only (one `no-console` disable per file); library modules return data.

Generated JSON directories (`surfaces/`, `history/`, `diffs/`, `audits/`, `shapes/`,
`decisions/` and the shipped copies) are excluded from `oxfmt` in `.oxfmtrc.jsonc`, because the
formatter would collapse short arrays and break the byte-for-byte `--check`. Hand-written
fixtures and code must pass `pnpm exec oxfmt --check`.
