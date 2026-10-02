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

- **Surfaces**: the exports of every public module at a release tag, read from source with
  `oxc-parser` and `oxc-resolver`, each export carrying the id of the file and binding that
  declares it. The 4.12.8 surface ships (`surface.4.12.8.json`); the surface of every later
  release, and `head` for the working tree, is scratch (`surfaces/<version>.json`).
- **History** (`history/<a>-<b>.json`, scratch): what git says about the files between two
  releases (renames, copies, deletions) and, for every declaration that vanished, the commit that
  removed it and the exported declarations that commit added.
- **Diffs** (`diffs/<a>-<b>.json`): the exact change from one surface to the next, plus the map
  from every declaration id of `a` to its id in `b` (or `null`). Applying the diffs to the 4.12.8
  surface rebuilds every later surface, so the plugin ships one surface and eight diffs, and the
  pipeline rebuilds a release surface the same way when no scan is on disk.
- **Decisions** (`decisions/<from>.json`): for declarations git cannot follow, the successor a
  judge chose from the recorded evidence (the project thread, a Claude model or TypeSafe AI's
  Jev), or "removed" with the removing PR and the smallest shim that restores the export.
  Reviewed by a person before they ship.
- **Audits and shapes** (`audits/`, `shapes/`, scratch): the package as actually published on
  npm, compared with the surface, and the `.d.ts` signatures the judge gets as evidence.

`preferences.json` holds the audience choices: Ember wins ties between equally good homes, the
Node tooling packages are never mapped, `ember-data/store` and friends report instead of
rewriting.

The data lives in one place, the plugin's data directory
`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/`: `releases.json`,
`surface.4.12.8.json`, `diffs/`, `decisions/`, `preferences.json` and `messages.json`, all
git-tracked and shipped. Scratch is `tmp/public-exports-mapping/`, git ignored: it rebuilds from
the release tags, git and npm in seconds, so nothing in it is committed.

## Commands

```
node scripts/public-exports-mapping/cli.mjs <command> [...args] [--check]

surface <version|head> | --all     surfaces from the release tags (detached worktrees, removed after)
history <a> <b>                    file renames and symbol moves between two releases, from git
diff <a> <b>                       the diff between two surfaces, using the history
audit <version> | --all            the published packages against the surface (npm tarballs, cached)
judge --from <v> [--to <v>]        evidence bundles and a judge for the residue; --dry-run, --import, --calibrate
judge --compare <a> <b>            where two judges' decisions agree and differ
update                             surface head, history and diff from the newest release, judge --check
release <version>                  everything for a newly listed release
```

Every command takes `--check`: it recomputes the files in memory, prints each data file that
would change and exits 1 without writing it; scratch files are written either way.
`pnpm lint:public-exports` is `update --check`; CI runs it in the `public-exports` job with a
full checkout, because the history step reads git from the newest release tag to `HEAD`. A
shallow clone makes `history` refuse to run.

Tests: `pnpm test:scripts` runs `scripts/__tests__/public-exports-mapping-*.spec.mjs`. The
plugin's reader and rule are tested with `pnpm test:legacy-imports` in
`packages/eslint-plugin-warp-drive`.

## Adding a release

1. Add the version to the data directory's `releases.json` (the latest patch of the minor, tag
   `v<version>`).
2. `node scripts/public-exports-mapping/cli.mjs release <version>`: surfaces the tag, derives
   history and diff from its predecessor, audits the published packages and, when the version is
   the newest, refreshes `head` the way `update` does.
3. Read `tmp/public-exports-mapping/audits/<version>.json`: a module the surface has and the
   package does not ship, or a token that disagrees, means the surface rules or the build config
   need a look.
4. `judge --from 4.12.8` (and any other `from` that has decisions) with `--check` first: a
   decision whose choice no longer exists at the newest release is stale and is re-judged.
5. Commit the data directory with the code that produced it; scratch stays out of git.

## Judging the residue

Declarations git cannot follow (45 of the 180 tokens of 4.12.8, in 34 declarations, at the time
of writing) need a decision. Judging runs locally, never in CI. The judge of record is the one
`preferences.json` names (`thread`: the project's Claude thread, or a person, reading the
evidence bundles), and its decisions are the ones that ship:

```
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --dry-run            # bundles and request bodies, no call
# read tmp/public-exports-mapping/judge/4.12.8-5.9.1/bundles.json, write answers.json
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --import answers.json  # -> decisions/4.12.8.json
```

An answers file maps each declaration id to `{ "choice": { "module", "export" } | null,
"confidence", "reason" }`; a `null` choice is "removed", and the import adds the removing PR and
the shim drafted from its diff. Two model judges read the same bundles and write next to them,
for comparison:

```
export ANTHROPIC_API_KEY=...                                                  # Claude, Message Batches API
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --calibrate   # agreement on the git-settled tokens
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --judge claude --threshold 0.8
export TYPESAFE_API_KEY=...                                                   # TypeSafe AI's Jev
node scripts/public-exports-mapping/cli.mjs judge --from 4.12.8 --judge jev
node scripts/public-exports-mapping/cli.mjs judge --compare \
  packages/eslint-plugin-warp-drive/src/legacy-import-mapping/decisions/4.12.8.json \
  tmp/public-exports-mapping/judge/4.12.8-5.9.1/decisions.jev.json
```

Calibration replays the declarations git settled with the truth hidden among the candidates and
prints agreement per confidence bucket and per kind; read the threshold off the `symbols` row,
the hardest kind, because the residue is harder than the average calibration item. Answers at or
above the threshold become decisions with `reviewed: false`; answers below it, and any choice
the newest surface does not contain, go to `judge-review.json` in the output directory for a
person. `--compare` lists where two judges differ: those entries are the ones to read first.
Flip `reviewed` to `true` after reading an entry.

## How the lint rule reads it

`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/index.js` loads the shipped
release list, the 4.12.8 surface, the diffs, the decisions and the preferences, rebuilds the
surface of the target release, follows each import's declaration through the diffs (resuming
when a declaration reappears under the same id after a gap, which is what 4.12 backports look
like), ranks the modules that export it at the target, and answers `keep`, `rewrite` or
`report`. The rule's `from` option defaults to 4.12 and `to` to the installed `@warp-drive/core`;
the rule docs in `src/rules/no-legacy-imports.md` list every message.
