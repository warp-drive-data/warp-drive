# Public exports mapping

`no-legacy-imports` in `eslint-plugin-warp-drive` rewrites imports written against an older
WarpDrive release to the modules that hold those tokens in this release. It reads one file per
supported older release, `packages/eslint-plugin-warp-drive/src/legacy-import-mapping/<from>.json`,
through the reader in that directory. This directory derives those files.

Read [INTENTION.md](./INTENTION.md) for why this directory exists and which properties every
change to it has to keep.

## How it fits together

A snapshot is what a release exports. `snapshots/5.7.json` lists every public token of
v5.7.0 and which of its modules are legacy. A module is legacy when it still lives under
`packages/` and its package was public in 5.5, the release the maps start from. The set of
files in `snapshots/` is the definition of "released".

A step is where each token of one release went in the next. `steps/5.7-5.8.json` has one entry
per token of the 5.7 snapshot, plus one `"*"` entry per module for the module's own move. It
is derived by following the re-exports in the legacy shims of the 5.8 tree, plus
`overrides/5.7-5.8.json` when that file exists. Steps between released tags never change.

The live step, `steps/5.9-5.10.json` while the root `package.json` is on 5.10, goes from the
last release to the working tree. It changes whenever a legacy package's exports change.

A shipped map is the fold of every step from one release to the working tree. The map from 5.7
is `steps/5.7-5.8.json`, then `steps/5.8-5.9.json`, then `steps/5.9-5.10.json`, one lookup per
step. `versions.json` next to the maps lists the releases a map exists for, oldest first.

Only the oldest map, `5.5.json`, is stored in full. Every later file is a delta against the map
of the release before it in `versions.json`. The reader rebuilds each full map from that chain.

## Commands

Everything goes through one script. Each command takes `--check`, which regenerates the same
files in memory, prints a unified diff for every file that would change, and exits 1.

```sh
node scripts/public-exports-mapping/cli.mjs update            # live step and shipped maps
node scripts/public-exports-mapping/cli.mjs archive           # every released snapshot and step, from tags
node scripts/public-exports-mapping/cli.mjs release 5.10      # promote a newly tagged minor
```

Each command prints one summary line, for example `update: 7 artifacts, 0 written`.

### After changing a legacy package's exports

```sh
node scripts/public-exports-mapping/cli.mjs update
node packages/eslint-plugin-warp-drive/tests/fixtures/legacy-import-decisions.js
git add scripts/public-exports-mapping/steps packages/eslint-plugin-warp-drive/src/legacy-import-mapping packages/eslint-plugin-warp-drive/tests/fixtures
```

The second command rewrites the table of reader decisions that the plugin's tests compare
against. Its diff shows every import whose outcome changed, so review it with the maps.

CI runs `pnpm lint:public-exports`, which is `cli.mjs update --check`, in the `lint` job on
every PR. It needs no tags.

### Writing an override

Some moves leave no shim behind. The request-state tokens that landed in both
`@warp-drive/core/reactive` and `@warp-drive/ember` in 5.8 are one: the shims cannot derive a
target, and the maintainers chose `@warp-drive/ember` because older Ember apps are the lint's
audience. Write such a move by hand in `overrides/<from>-<to>.json`:

```json
{
  "schema": 1,
  "kind": "overrides",
  "from": "5.7",
  "to": "5.8",
  "entries": [
    {
      "module": "@warp-drive/core/store/-private",
      "export": "getRequestState",
      "to": { "module": "@warp-drive/ember", "export": "getRequestState" },
      "note": "Landed in both @warp-drive/core/reactive and @warp-drive/ember in 5.8; ember is the target because older Ember apps are the lint's audience."
    }
  ]
}
```

`to` may be `null` to declare a token removed. Source `typeOnly` comes from the from snapshot
and target `typeOnly` from the to tree, so an override states neither. The `note` is the
maintainers' reason for the move. It stays in the override and the step file it produces, and
it does not reach the shipped map.

An override is refused, and the command fails, when:

- its source is not a token of the from release,
- its target is not a token of the to release,
- two entries name one token,
- the shims already derive the same answer. Delete the override then.

After editing an override, run `archive` for a released step or `update` for the live one,
then commit both the override and the regenerated files.

### Releasing

When `v5.10.0` is tagged and main is bumped to `5.11.0-alpha.0`, in that same PR:

```sh
git fetch --tags
node scripts/public-exports-mapping/cli.mjs release 5.10
node packages/eslint-plugin-warp-drive/tests/fixtures/legacy-import-decisions.js
git add scripts/public-exports-mapping packages/eslint-plugin-warp-drive/src/legacy-import-mapping packages/eslint-plugin-warp-drive/tests/fixtures
```

This writes `snapshots/5.10.json`, freezes `steps/5.9-5.10.json` from the two tags, starts
`steps/5.10-5.11.json` as the new live step, and rewrites every shipped map, now including
`5.10.json`.

Between the version bump and this command, `update --check` fails on main: the working tree
says 5.11 while the newest snapshot says 5.9, so the live step it wants to write is
`5.9-5.11`, which skips a release. The failure message names the `release` command. That is
deliberate: the release step cannot be forgotten.

### Archival check

`archive --check` rebuilds every released snapshot and step from tags and diffs them. The
`Public Exports Archive` workflow runs it on every change under `scripts/public-exports-mapping/`
and once a week, with the full history and tags fetched. It fails only when the scanner or the
shim analysis changed, and then the diff is the review.

## Reading a shipped map

Every entry describes one token of the from release. `to` is where it is in the to release.
The reader's `resolve(module, name)` turns an entry into the decision the rule applies.

- `to` is `null`: the token is removed. Nothing in the to release stands in for it. `resolve`
  answers `report` with reason `removed`, and the rule leaves the import alone.
- `to.module` is listed in `legacyModules`: the token is legacy. It still lives in a legacy
  package, either because that package declares it itself or because it forwards to another
  legacy package. There is no modern module to rewrite to yet, so `resolve` answers `report`
  with reason `legacy` and a human decides.
- The source is a value and `to.typeOnly` is true: a value import answers `report` with reason
  `type-only`, because rewriting it would import a name that has no runtime value. A type import
  follows the other rules.
- `to` names the source's own module and export: unchanged. `resolve` answers `keep`.
- Anything else is a `rewrite` to `to`.

An entry whose `export` is `"*"` is the module's own move. It is non-null only when the legacy
shim forwards everything through exactly one `export *`, so it is the sound route for a name
the map does not list individually. `resolve` uses it for names added after the from release,
and a namespace import asks for `"*"` directly. A module whose `"*"` entry points at itself,
such as `@warp-drive/build-config`, did not move, so any name from it answers `keep`. A module
the map knows, with no entry for the name and no module-level move, answers `report` with
reason `untracked`. A module the map does not know answers `keep`.

An entry holds exactly `module`, `export`, `typeOnly` and `to`. It does not record which
releases moved the token or whether an override chose the target.

```json
{
  "schema": 1,
  "kind": "merged",
  "from": "5.5",
  "via": ["5.6", "5.7", "5.8", "5.9"],
  "to": "5.10",
  "legacyModules": ["@ember-data/adapter", "..."],
  "entries": [
    {
      "module": "@ember-data/store",
      "export": "default",
      "typeOnly": false,
      "to": { "module": "@warp-drive/core", "export": "Store", "typeOnly": false }
    },
    {
      "module": "@ember-data/store/-private",
      "export": "getRequestState",
      "typeOnly": false,
      "to": { "module": "@warp-drive/ember", "export": "getRequestState", "typeOnly": false }
    },
    {
      "module": "@warp-drive/experiments/persisted-cache",
      "export": "PersistedCache",
      "typeOnly": false,
      "to": null
    }
  ]
}
```

The later files hold deltas. `5.7.json` lists the `module::export` keys the 5.6 map has and the
5.7 map lacks, and every entry that is new in 5.7 or differs from the 5.6 map's entry.
`legacyModules` appears only when it differs from the base's.

```json
{
  "schema": 1,
  "kind": "merged-delta",
  "from": "5.7",
  "base": "5.6",
  "via": ["5.8", "5.9"],
  "to": "5.10",
  "remove": ["@warp-drive/core/store/-private::createMemo", "..."],
  "set": [{ "module": "@ember-data/legacy-compat", "export": "*", "typeOnly": false, "to": null }, "..."]
}
```

## Layout

```
scripts/public-exports-mapping/
  cli.mjs          update | archive | release, each with --check
  generate.mjs     the scanner; scan() reads build configs and lists exports
  surface.mjs      what a version exports; tags, working tree, legacy modules, snapshots
  step.mjs         where a token goes next; shim analysis, the "*" rule, overrides
  merge.mjs        the fold, the residual-chain check, and the delta encoding
  artifacts.mjs    paths, byte-stable serialization, check mode
  token.mjs        Token, identity, ordering
  snapshots/       one per released minor; their names define what is released
  steps/           one per consecutive pair, plus the live step
  overrides/       hand-written, optional per step
```
