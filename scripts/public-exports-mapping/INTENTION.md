# Why the public exports mapping exists

An app that still imports from `@ember-data/store` has to find those tokens somewhere in a
current WarpDrive release. The lint rule `no-legacy-imports` in `eslint-plugin-warp-drive`
answers that question for one import at a time, and it can only answer it from data. This
directory is where the data comes from. The original task spec came from
[issue #10382](https://github.com/warp-drive-data/warp-drive/issues/10382), and this document
carries the parts of it that still hold, plus the decisions taken while building the generator.

## What this directory is for and who reads its output

The rule exists to migrate older Ember apps. That audience decides every ambiguous call in
here. A token whose new home could be argued two ways goes to the home an Ember app can use.

The baseline is 5.5. The new `warp-drive-packages/` tree shipped in 5.6, so 5.5 is the last
release whose exports are entirely the old contract. `snapshots/5.5.json` is that contract,
545 named tokens across 94 modules plus one `"*"` token per module, and it also defines which
packages count as legacy.

Two consumers read the output. The rule reads it today through the reader at
`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/index.js`. A codemod in
`packages/codemods` will read the same reader, so a user can rewrite a whole app instead of
fixing lint errors one file at a time.

Three requirements come straight from the original spec. Every replacement a map names must
exist in the release the map targets, because a rewrite onto a module that is already gone is
worse than no rewrite. A 5.5 token with no successor has to show up as such rather than
disappear quietly. Regeneration is one command, and CI runs it on every pull request, so the
committed data cannot drift from the packages it describes.

## The invariants

These hold across the whole directory. A change that breaks one of them is a redesign, not a
fix.

- A step is a total function over the from-release's tokens. `deriveStep` writes one entry for
  every token of the from snapshot. No token is left out, and no entry is invented for a token
  the from-release never had.
- `"*"` is defined once. `surfaceOf` adds exactly one `"*"` token to every module it finds, and
  nothing else creates one. A `"*"` token names the module, not a binding, so its `typeOnly` is
  always false.
- Merge is a strict left fold. `mergeSteps` walks the steps oldest first and does one lookup per
  step. A lookup that finds nothing is an error. There is no revival, so a token whose target
  went `null` stays `null` through every later step, and there is no fixpoint pass.
- A `"*"` token is the module's own move. It has a non-null target only when the legacy shim's
  only export is one `export *`, which forwards every name unchanged. `parseModule` records that
  specifier as `forward`, and it is the only thing the resolver reads for `"*"`. That makes it a
  lookup rather than the guess the rule's old module-level fallback made. A shim that names any
  export of its own, a default included, has no `"*"` target, and names it does not list stay
  unmapped.
- Legacy is derived, not maintained. A module is legacy at a version when it lives under
  `packages/` at that version and its package was public in 5.5. `surfaceOf` computes the set,
  and each map carries it as `legacyModules`. Nothing lists legacy packages by hand.
- Removed is `to: null`, and legacy is a target whose module appears in `legacyModules`. There
  is no `reason` field on an entry. Both facts are already in the data, and a second spelling of
  either would be a second thing to keep true.
- Tagged trees are immutable, and the committed snapshots and archived steps must equal a fresh
  derivation from them. `archive --check` enforces this. `steps/5.7-5.8.json` describes two
  tagged trees, so it changes only when the derivation changes, and a pull request that improves
  the derivation re-derives the archived files with it. Only the live step, `steps/5.9-5.10.json`
  while the root `package.json` is on 5.10, changes on an ordinary pull request. The set of files
  in `snapshots/` is the definition of which releases exist.
- Every step goes to the next release. `stepPairs` builds the list of steps once, from
  `snapshots/` and the root `package.json`, and refuses a pair that skips a minor. A working tree
  ahead of the next minor gets a message naming the `release` to run, not a step that skips it.
- Every command plans all of its files in memory, then syncs them once. Its `--check` mode diffs
  that same plan, so `release 5.10 --check` shows exactly what `release 5.10` writes. It prints
  a unified diff for each file that would change and exits 1.
- Shipped maps are precomputed. `packages/eslint-plugin-warp-drive/src/legacy-import-mapping/5.5.json`
  already holds the fold through 5.6, 5.7, 5.8, 5.9 and the working tree, 639 entries. Each
  later file is a delta against the map of the release before it in `versions.json`. The reader
  rebuilds full maps from that chain once per load, and it applies deltas, never steps. The rule
  does one lookup on a full map and never composes steps at lint time.
- The reader is the public API. `loadMap` and `listFromVersions` in
  `packages/eslint-plugin-warp-drive/src/legacy-import-mapping/index.js` are what a consumer may
  depend on, and `index.d.ts` next to it is their only type declaration. A loaded map has one
  method, `resolve(module, name)`, and it returns the decision. The JSON files are an
  implementation detail of that reader.

## Decisions and why

Tokens that landed in two packages point at `@warp-drive/ember`. In 5.8, `getRequestState`,
`getPromiseState`, `PromiseState`, `RequestState` and `RequestLoadingState` landed in both
`@warp-drive/core/reactive` and `@warp-drive/ember`. The shims cannot choose between two real
homes, so `overrides/5.7-5.8.json` chooses for them. `@warp-drive/ember` wins because the apps
this rule serves are Ember apps, and a rewrite they can paste into an Ember component is worth
more than the framework-neutral module.

A value and a type of one name collapse into one token. Token identity is `(module, export)`,
and `typeOnly` is an attribute of the token rather than part of its identity. The old mapping
had three names exported as both a value and a type, and the rule's `module::export` key silently
kept whichever came last. One token per key means the data cannot express the collision, so the
rule needs no tie-break rule. All three pairs agree on their destination today.

A value import never lands on a type. When a token was a value in the from release and is only a
type in the map's `to` release, `resolve` answers `report` with reason `type-only` for a value
import, whether or not the token moved, and treats a type import as usual. It is the only place
`typeOnly` changes a decision. A token that was already a type keeps its rewrite, because a value
import of it could never have used a runtime value.

Overrides are refused when they are redundant. `deriveStep` fails an override whose source is
not a token of the from-release, whose target is not a token of the to-release, that names a
token another override already names, or that states exactly what the shims already derive.
The last of those is the one worth arguing about. It keeps `overrides/` to the moves that are
genuinely underivable, and it turns a future improvement in the shim analysis into a CI failure
that says to delete the override, instead of leaving a hand-written entry to quietly outlive
its reason.

There is no revival. A token that dies in one step cannot come back in a later one, even though
`-private` signal internals died at 5.8 and names from that set exist again at 5.9. Allowing revival
would mean a second lookup path and an override that names a source the from-release does not
have. The cost falls on 5.6 and 5.7 users of private modules, not on the 5.5 baseline, and that
is the trade we took.

Maps ship precomputed rather than chained at lint time. `eslint-plugin-ember` composes
`ember-rfc176-data` one hop at a time, and that is how its autofix moved `htmlSafe` onto a path
the same dataset deprecates. A merged map cannot do that, because the fold resolves the chain
before anything ships and `mergeSteps` then asserts that no target of the map appears as a
source in it. A lint rule also has no loop to run a chain in, so one lookup is a requirement
here rather than a speed-up.

Later maps ship as deltas against the previous release. A token that did not change between two
releases has the same merged entry in both maps, so full files repeat most of their content. With
deltas, a live-step change to one token rewrites the full map and only the deltas where that
token's entry differs from the previous release's. A new release adds one small file. The oldest
map stays whole because it is every consumer's default, so the default load reads one file.
`cli.mjs update` rebuilds every delta through the reader's own `applyDelta` and fails when the
result differs from the full map, so every `--check` run is also a round-trip test of the
decoder.

The codemod imports the reader, not the JSON. Both consumers have to answer the same question,
which is whether an import should be rewritten, reported, or left alone. That policy lives once,
in the reader's `resolve`, which answers `rewrite`, `report` or `keep` for one imported name. The
rule only applies that answer. If the codemod parsed the JSON itself, or rebuilt the decision
from lower-level lookups, the two would drift, and the on-disk shape would become public API that
no one can change.

## What it deliberately does not do

- No reverse lookup. Nothing here answers where a modern token used to live.
- No per-entry `reason` string, no `applicability` levels, and no named codemod recipes. Each of
  those was in the prior art and each restates something the entry already carries or describes
  work no entry here does.
- No split targets. A token has one destination. A move that genuinely splits needs a human,
  and the map reports it rather than guessing a half of it.
- No dates, tool versions, or absolute paths in any artifact, so a regeneration that changes
  nothing produces the same bytes.
- No formatting by `pnpm lint:oxfmt`. `.oxfmtrc.jsonc` ignores `snapshots/`, `steps/` and the
  shipped maps, because byte-stability would otherwise depend on a formatter's fill rule.
  `cli.mjs --check` is the formatter for those files.

## Open follow-ups

The codemod in `packages/codemods` is not written yet. It needs an `apply legacy-imports` entry
with a `--from` flag, and it must go through the reader for every decision.

Later maps already ship as deltas. A compact marker for an entry whose target is the token
itself is still possible and not needed yet. Measured, it takes the shipped total from about
416 KB to about 315 KB. The reader hides the on-disk shape from both consumers, so this can land
later without touching the rule or the codemod.

The 5.5 tokens with no successor need maintainer decisions. 43 tokens in
`packages/eslint-plugin-warp-drive/src/legacy-import-mapping/5.5.json` have `to: null`. Another
47 entries with `to: null` are `"*"` entries for modules whose shim has no single destination.
Those are not lost tokens. The original spec asked for the lost tokens to be found and fixed.
They are found. Whether each one gets a
replacement in a current package or is confirmed as gone for good is a call the maintainers
make, one token at a time.

## Commands

Read [README.md](./README.md) for the commands and the file layout.
