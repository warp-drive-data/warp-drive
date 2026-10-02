# Public exports mapping: data contract

This directory derives, per released version of this repository, what every public package
exports, how those exports moved between releases, and from that the import rewrites that
`no-legacy-imports` in `eslint-plugin-warp-drive` (and later a codemod) apply. Several people
build the parts in parallel, so this file pins the file formats and the rules every part must
agree on. When this file and a part disagree, this file wins; change this file first.

[README.md](./README.md) says why the data exists and how to work with it; this file is the
format specification the code and the data follow.

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
  artifacts.mjs     canonical JSON, write/check helpers, the data and scratch roots         (shared)
  data.mjs          where each file lives; the surface of a release, derived from the diffs (shared)
  cli.mjs           `node scripts/public-exports-mapping/cli.mjs <command> ...`; loads commands/*.mjs
  commands/*.mjs    one file per command: `export const name`, `export const describe`, `export async function run(argv, context)`
  resolver.mjs      oxc-resolver configured for a source tree                          area A
  exports.mjs       what one source file exports, from the oxc-parser module record     area A
  worktrees.mjs     a git worktree per release tag, disposed after use                  area A
  surface.mjs       entry discovery per era; the surface of one release                 area A
  history.mjs       file renames and symbol moves between two releases, from git        area B
  diff.mjs          `diffs/<a>-<b>.json` from two surfaces and a history                area B
  published.mjs     the package as published on npm, from a cached tarball              area C
  audit.mjs         surface vs published package; `audits/<version>.json`, `shapes/`    area C
  map.mjs           the stages and the ranking; a map for any (from, to)                area D
  judge.mjs         evidence bundles, the judges, `decisions/<from>.json`               area E
packages/eslint-plugin-warp-drive/src/legacy-import-mapping/                the data directory, area D
  index.js index.d.ts map-core.js   the reader: loadMap({ from, to }).resolve(module, name, { typeOnly })
  releases.json  surface.4.12.8.json  diffs/*.json  decisions/*.json  preferences.json  messages.json
tmp/public-exports-mapping/                                                 scratch, git ignored
  surfaces/<version>.json  history/<a>-<b>.json  audits/  shapes/  judge/<from>-<to>/
packages/eslint-plugin-warp-drive/src/rules/no-legacy-imports.{js,md}                   area D
scripts/__tests__/public-exports-mapping-<area>.spec.mjs                                each area
scripts/__tests__/fixtures/public-exports-mapping/<area>.mjs                            each area
```

The data directory is the product and its only copy: what the plugin ships, git-tracked, and
checked byte-for-byte in CI (`pnpm lint:public-exports`). Scratch holds what rebuilds from the
tags, git and the registry in seconds: the surface of every release but the baseline (scanned by
`surface <version>`, or derived by applying the diffs to the baseline surface when no scan is on
disk; the two are identical), the histories (`history <a> <b>`, or computed from git when the
judge needs one), the audits and shapes, and the judge's bundles. A scratch file is written
whenever a command computes it, `--check` included, and never counts as drift.

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
  files in memory, prints each data file that would change, writes none of them, exits 1 on a
  difference; scratch files are written either way.
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
| 4.12 and 5.0, v1 addons (no build config, no `exports`) | every `.js`/`.ts` under `addon/` and `addon-test-support/` | `<pkg>/<path under addon/ without extension>`, `index` dropped; `<pkg>/test-support/<path under addon-test-support/>` |
| any era, no build config | `package.json#exports` targets, else `main` (default `index.js`) | the key with `./` dropped; `<pkg>` for `main` |
| 5.5 to 5.8, `vite.config.mjs` | `export const entryPoints = [...]`, globs relative to the package | same |
| 5.9+, `tsdown.config.mjs` | `export const entryPoints = [...]` | same |
| 5.4+, `package.json#exports` | subpath keys; a pattern key expands against the entry outputs | the key with `./` dropped |

Private packages (`"private": true`) are skipped; a published package with no modules is listed
with `modules: []`. A pattern key expands to the entry outputs Node resolves back to it, with
the file's own name kept (`ember-data/-private/index`, because `./*` cannot serve the short
form); an entry an exact key already names is not added again through a pattern. A module is
public unless any path segment is `-private` or starts with `-`; it is "old contract" when its
package is `ember-data` or `@ember-data/*`. `@warp-drive/legacy/*` is modern. Node tooling
packages that are public on npm but not application API (`eslint-plugin-warp-drive`,
`@ember-data/codemods`, `warp-drive`) stay in the surfaces and are listed in
`preferences.ignorePackages`: the map answers `keep` for their tokens, neither the map nor the
judge takes a candidate from them, and the judge never lists them as residue.

## Files

### `surface.<baseline>.json` and `surfaces/<version>.json` (area A)

The baseline's surface is data; every other release's surface is scratch, `surfaces/<version>.json`,
and `data.mjs` derives it from the baseline and the diffs when no scan is on disk.

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

### `history/<a>-<b>.json` (area B, scratch)

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
the same pair is a rename. A copy whose source survives includes the source in its sorted list:
`old -> [copy, old]`. Git runs with `-l0`, `core.quotePath=false`, `--literal-pathspecs`,
`--no-textconv`, `--no-show-signature` and a cleared git environment, so `cwd` alone decides the
repository.

`symbols` has one entry per declaration of surface `a` that has no same-id declaration in surface
`b` after `files`, when a commit in `v<a>..v<b>` removed that exported binding from its file: the
newest `git log -S` hit that, by parsing the file before and after, really removed the binding (a
hit that only touched a comment or a usage does not count; a default export is searched as
`export default` or `as default`, not by its local name). The entry carries the abbreviated hash
(10 characters), the subject, and `added`: the exported declarations that commit added in the
files it touched, with their ids mapped forward through later renames in the range so they name
paths of `v<b>` (a file deleted again before `v<b>` keeps its old path: no declaration of `b`
can match it, but it still counts as something the commit added outside `b`). Nothing removed
means no entry. `history` needs the full commit range: a shallow
clone makes it throw, so CI checks out full history with tags (`fetch-depth: 0`).

### `diffs/<a>-<b>.json` (area B, data)

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
nothing in `b` continues it. An id continues through `files` first. Next, when a token
`(module, name)` of `a` that carried the id still exists in `b` with a declaration in the same
file or in a file that `files` says continues it, the id maps to that declaration (a default
export that became a named one in the same file is the usual case; when several such tokens
disagree, the one whose local name matches the old local name wins, else the first in sorted
module order). Otherwise its `symbols` entry decides, in this order: an `added` declaration with the same local name; for a default export, the
one declaration the commit added in the same file (default turned named); the single `added`
declaration of the same kind, but only when the commit added nothing outside surface `b` and
removed no other declaration of that kind that would land on the same target. Anything else maps
to `null`, and the judge (area E) decides.

### `audits/<version>.json` and `shapes/<version>.json` (area C, scratch)

The published package at the version the tag's `package.json` names (`npm pack` into a cache
directory outside the repository, `$WARP_DRIVE_EXPORTS_CACHE` or `<repo>/../.cache/warp-drive-public-exports`,
keyed by name and version; an unpublished version is cached as such too, so a second run needs
no registry). `audits/<version>.json` records, per package: the `exports` map, every `exports`
target that does not ship, content-hashed chunks and parse errors, and per module the runtime
export names (from `oxc-parser` over the shipped `.js`) and the type names (from the `.d.ts`),
followed by the differences against `surfaces/<version>.json`: `modulesNotShipped`,
`modulesNotInSurface`, `tokensNotShipped`, `tokensNotInSurface` and `kinds` disagreements. The
module list keeps code modules only: an `exports` key whose target is `.js`, `.mjs`, `.cjs`,
`.ts` or `.d.ts`, skipping `package.json`, `*.md`, `*.json`, `blueprints/` and the
`unstable-preview-types` keys; a pattern key expands to the files Node resolves back to it.
For v1 addons (4.12 and 5.0) the tarball's `addon/` tree is the module list and
`addon-test-support/` lists as `<pkg>/test-support/...`. A package the surface does not cover is
counted under `packagesNotInSurface` and gets no token comparison; a package that ships no
`.d.ts` compares `value` tokens only and records `types: "not published"`. Published declaration
ids are `<package>/<file in tarball>#<local name>` (`#default` only for an anonymous default);
`shapes/<version>.json` is `{ schema, kind: "shapes", version, shapes: { <id>: <string> } }`
and maps each of them, plus the source declaration id when the local names match, to one
string: the declaration's signature or member list as the `.d.ts` prints it, for the judge's
evidence. `audit` runs at release time and on backports, not in CI, because it needs
the registry and release tags.

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
      "judge": "thread", "reviewed": false
    },
    {
      "decl": "packages/adapter/src/error.ts#errorsArrayToHash",
      "source": { "module": "@ember-data/adapter/error", "export": "errorsArrayToHash" },
      "choice": null, "removedIn": "#8550",
      "shim": "export function errorsArrayToHash(errors) {\n  // ...\n}",
      "confidence": 0.98, "reason": "Deleted with the 4.x deprecations in #8550; nothing took its place.",
      "judge": "thread", "reviewed": false
    }
  ]
}
```

`choice` names a token of the `to` surface or is `null` for "removed, no replacement". `shim`
is the smallest code that restores a removed token, drafted from the removing commit's diff
for a human to trim. `reviewed` flips to `true` by hand. Entries are sorted by `decl`. Decisions
are keyed by `decl` so they survive a module rename; a decision whose `decl` is not in the
`from` surface, or whose `choice` is not in the `to` surface, is stale: `judge --check` fails on
it, and a live `judge` run drops it and judges the declaration again.

The judge asks `claude-opus-5-5` through the Message Batches API, one request per residue
declaration: a cached system prompt stating the ranking, the evidence bundle as the user turn,
a strict `record_successor` tool (`choice: { module, export } | null`, `confidence`, `reason`)
with `tool_choice` `auto`, since the model rejects a forced tool choice, and a retry round for
answers without a tool call. Calibration (`--calibrate`) replays the declarations git settled,
truth hidden among the candidates, and reports agreement per confidence bucket and per kind
(`files`, `symbols`, `same`); the threshold is read from the `symbols` row, the hardest kind.
Below the threshold, or when the choice is not a token of `to`, the answer goes to
`judge-review.json` in the output directory (`tmp/public-exports-mapping/judge/<from>-<to>/`,
git ignored) for a person. No model runs in CI.

Three judges read the same evidence bundles, and a decision's `judge` field says which one
answered: `claude-opus-5-5` (above), `jev` and `thread`. `--judge jev` asks TypeSafe AI's Jev
(`POST https://api.typesafe.ai/v1/systemone`, key `TYPESAFE_API_KEY` from the environment) one
`choice` question per declaration whose options are the candidate declarations and `removed`;
Jev returns a probability per option and a confidence and no text, so the reason it records
lists where the probability went. `thread` is the project thread or a person: they read the
bundles `--dry-run` writes and answer in a JSON file,
`{ "<decl>": { "choice": { "module", "export" } | null, "confidence": 0.9, "reason": "..." } }`,
which `--import <answers.json>` turns into decisions (a `null` choice gets `removedIn` and the
`shim` from the bundle's history). `preferences.judge` names the judge of record: its run
writes `decisions/<from>.json`, any other judge writes
`<out>/<from>-<to>/decisions.<judge>.json`, and `judge --compare <a.json> <b.json>` lists where
two such files (decisions, review or answers) agree, differ and fall below the threshold, so a
second judge's disagreements go to a person before a shipped decision changes.

### `preferences.json` (shared, data)

```json
{ "schema": 1, "audience": "ember", "tieBreak": ["@warp-drive/ember"],
  "ignorePackages": ["eslint-plugin-warp-drive", "@ember-data/codemods", "warp-drive"],
  "report": { "ember-data/store": "side-effect", "ember-data": "side-effect" },
  "judge": "thread" }
```

`judge` is the judge of record for `decisions/<from>.json`: `claude`, `jev` or `thread`
(default `claude`); the other judges write next to the scratch bundles for `judge --compare`.

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

0. a module that is a home (`forward` null or a relative specifier) before a shim (`forward` a
   bare specifier naming another module);
1. a public module before a `-private` one;
2. a modern package before an old-contract one;
3. fewer path segments below the package name;
4. not `deprecated`;
5. `kind` `value` before `type`;
6. the same export name as the source;
7. a module of a package in `preferences.tieBreak` (the entry or a subpath of it), in that
   order;
8. module name, then export name, alphabetical.

When the source token itself is a candidate and rules 0 to 5 do not separate it from the
winner, the source token wins: an import that is already at a home as good as any other is not
rewritten (`@warp-drive/react`'s `getRequestState` stays on React, whatever `tieBreak` says).

A decision in `decisions/<from>.json` is judged against the newest release. For an earlier `to`
the reader follows the chosen declaration backward through `declarations` to that release and
prefers the exact chosen token when it exists there; when the declaration does not exist at
that `to`, the token reports `removed`.

The decision for an import of `(module, name)` written against `from`:

- module not in the `from` surface: `keep`;
- module in `preferences.report`: `report` with that reason;
- name not in the module: `report untracked`, unless the module's `forward` at `to` names a
  module, then `rewrite` to `(forward, name)`;
- no candidate: `report removed` (with `removedIn` and `shim` when a decision carries them);
- a value import, the source export was a `value` at `from` and the winner is `kind` `type`:
  `report type-only` (checked before `keep`, since a value that became a type under the same
  name breaks at runtime);
- winner is the same `(module, name)`: `keep`;
- winner in a `-private` module (a forward into one included): `rewrite` with
  `reason: 'private-target'`;
- otherwise `rewrite`.

A namespace or side-effect import (`*`) follows the module: a `preferences.report` entry wins,
then a `forward` to another module rewrites, then a module whose exports all moved to one
module rewrites there, then `keep` while the module exists at `to`, else `report removed`.

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
cli.mjs judge --from <v> [--to <v>] [--dry-run] [--calibrate] [--threshold 0.8] [--judge claude|jev|thread] [--import answers.json] [--limit n] [--effort e] [--batch id] [--out dir] [--check]   area E
cli.mjs judge --compare <a.json> <b.json> [--threshold 0.8]   area E: where two judges agree and differ
cli.mjs update [--check]                        area A: surface head, history and diff <newest>-head, judge --check; drops a stale head diff
cli.mjs release <version> [--keep]              area A: surface + history + diff + audit for a newly tagged version, then the update steps when it is the newest
```

`cli.mjs` discovers `commands/*.mjs`; a command module that is missing is reported as "not
implemented yet" (exit 2) rather than failing the loader. Area A writes `cli.mjs` and the loader;
every other area adds only its own `commands/<name>.mjs`.

A command exports `run(argv, context)`: `argv` is the argument list after the command name,
`context` is `{ dataRoot, scratchRoot, cwd }` with defaults of the data directory, the scratch
directory and `process.cwd()` (tests pass temp directories). `run` resolves to the process exit code and throws on a usage error or
a missing input; the loader prints the error message and exits 1. `console` output belongs in
`commands/*.mjs` only (one `no-console` disable per file); library modules return data.

The data directory's JSON is excluded from `oxfmt` in `.oxfmtrc.jsonc`, because the formatter
would collapse short arrays and break the byte-for-byte `--check`; scratch is git ignored.
Hand-written fixtures and code must pass `pnpm exec oxfmt --check`.
