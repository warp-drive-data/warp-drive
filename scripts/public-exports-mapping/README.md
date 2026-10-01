# Public exports mapping

What every published `@ember-data/*`, `@warp-drive/*` and `ember-data` package exported at each
release since 4.12, how those exports moved between releases, and the rewrite the
`warp-drive/no-legacy-imports` lint rule applies to an import written against an older release.

[CONTRACT.md](./CONTRACT.md) is the format specification: file shapes, identities, the ranking
and the decision rules. This file says why the data exists and how to work with it.

## Why

Apps on ember-data 4.12 import from modules that 5.x moved, renamed, split or removed. The lint
rule (and later a codemod) can only rewrite those imports when it knows, for every export of the
old release, where the same declaration lives in the release the app is moving to. Hand-written
maps rotted, and a single-snapshot map could not say what happened between two releases a user
actually has. So the data is derived:

- **Surfaces** (`surfaces/<version>.json`): the exports of every public module at a release tag,
  read from source with `oxc-parser` and `oxc-resolver`, each export carrying the id of the file
  and binding that declares it. Also `head.json` for the working tree.
- **History** (`history/<a>-<b>.json`): what git says about the files between two releases
  (renames, copies, deletions) and, for every declaration that vanished, the commit that removed
  it and the exported declarations that commit added.
- **Diffs** (`diffs/<a>-<b>.json`): the exact change from one surface to the next, plus the map
  from every declaration id of `a` to its id in `b` (or `null`). Applying the diffs to the 4.12.8
  surface rebuilds every later surface, so the plugin ships one surface and eight diffs.
- **Decisions** (`decisions/<from>.json`): for declarations git cannot follow, the successor a
  judge chose (a Claude model, with the evidence recorded), or "removed" with the removing PR and
  the smallest shim that restores the export. Reviewed by a person before they ship.
- **Audits and shapes** (`audits/`, `shapes/`): the package as actually published on npm,
  compared with the surface, and the `.d.ts` signatures the judge gets as evidence.

`preferences.json` holds the audience choices: Ember wins ties between equally good homes, the
Node tooling packages are never mapped, `ember-data/store` and friends report instead of
rewriting.

## Commands

```
node scripts/public-exports-mapping/cli.mjs <command> [...args] [--check]

surface <version|head> | --all     surfaces from the release tags (detached worktrees, removed after)
history <a> <b>                    file renames and symbol moves between two releases, from git
diff <a> <b>                       the diff between two surfaces, using the history
audit <version> | --all            the published packages against the surface (npm tarballs, cached)
judge --from <v> [--to <v>]        evidence bundles and the Claude judge for the residue; --dry-run, --calibrate
ship                               copy the plugin's data into packages/eslint-plugin-warp-drive
update                             surface head, history and diff from the newest release, ship
release <version>                  everything for a newly listed release
```

Every command takes `--check`: it recomputes the files in memory, prints each one that would
change and exits 1 without writing. `pnpm lint:public-exports` is `update --check`; CI runs it in
the `public-exports` job with a full checkout, because the history step reads git from the newest
release tag to `HEAD`. A shallow clone makes `history` refuse to run.

Tests: `pnpm test:scripts` runs `scripts/__tests__/public-exports-mapping-*.spec.mjs`. The
plugin's reader and rule are tested with `pnpm test:legacy-imports` in
`packages/eslint-plugin-warp-drive`.

## Adding a release

1. Add the version to `releases.json` (the latest patch of the minor, tag `v<version>`).
2. `node scripts/public-exports-mapping/cli.mjs release <version>`: surfaces the tag, derives
   history and diff from its predecessor and to `head`, audits the published packages, ships.
3. Read `audits/<version>.json`: a module the surface has and the package does not ship, or a
   token that disagrees, means the surface rules or the build config need a look.
4. `judge --from 4.12.8` (and any other `from` that has decisions) with `--check` first: a
   decision whose choice no longer exists at the newest release is stale and is re-judged.
5. Commit the data with the code that produced it.

## Judging the residue

Declarations git cannot follow (72 of the 180 tokens of 4.12.8, at the time of writing) need a
decision. The judge runs locally, never in CI:

```
export ANTHROPIC_API_KEY=...            # read from the environment only
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --dry-run   # bundles and request bodies, no call
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --calibrate # agreement on the git-settled tokens
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --threshold 0.8
```

Answers at or above the threshold land in `decisions/4.12.8.json` with `reviewed: false`;
answers below it, and any choice the newest surface does not contain, go to `judge-review.json`
in the output directory for a person. Flip `reviewed` to `true` after reading an entry. The
TypeSafe AI judge ("Jev") is an optional second opinion behind `--judge jev`; it is not
configured.

## How the lint rule reads it

`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/index.js` loads the shipped
release list, the 4.12.8 surface, the diffs, the decisions and the preferences, rebuilds the
surface of the target release, follows each import's declaration through the diffs (resuming
when a declaration reappears under the same id after a gap, which is what 4.12 backports look
like), ranks the modules that export it at the target, and answers `keep`, `rewrite` or
`report`. The rule's `from` option defaults to 4.12 and `to` to the installed `@warp-drive/core`;
the rule docs in `src/rules/no-legacy-imports.md` list every message.
