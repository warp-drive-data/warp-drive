# @warp-drive/diagnostic Changelog

## v5.8.0 (2025-10-07)

#### :bug: Bug Fix

* [#10393](https://github.com/warp-drive-data/warp-drive/pull/10393) fix: improve docs and make peek mutation safe ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10397](https://github.com/warp-drive-data/warp-drive/pull/10397) chore: begin converting core-tests to diagnostic and vite minimal ([@runspired](https://github.com/runspired))
* [#10349](https://github.com/warp-drive-data/warp-drive/pull/10349) chore: update all emberjs/data links to warp-drive-data/warp-drive ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.7.0 (2025-08-26)

#### :rocket: Enhancement

* [#10112](https://github.com/warp-drive-data/warp-drive/pull/10112) feat: @warp-drive/react <Request /> ([@runspired](https://github.com/runspired))
* [#10127](https://github.com/warp-drive-data/warp-drive/pull/10127) feat: Diagnostic Timeline ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10254](https://github.com/warp-drive-data/warp-drive/pull/10254) Migrate rendering tests to shared spec system ([@MehulKChaudhari](https://github.com/MehulKChaudhari))
* [#10261](https://github.com/warp-drive-data/warp-drive/pull/10261) feat: remove qunit-dom patch ([@BobrImperator](https://github.com/BobrImperator))
* [#10226](https://github.com/warp-drive-data/warp-drive/pull/10226) chore: use https for diagnostic by default, print url last ([@runspired](https://github.com/runspired))
* [#10130](https://github.com/warp-drive-data/warp-drive/pull/10130) chore: bump pnpm version ([@runspired](https://github.com/runspired))
* [#10129](https://github.com/warp-drive-data/warp-drive/pull/10129) chore: bump typescript to 5.9 ([@runspired](https://github.com/runspired))
* [#10124](https://github.com/warp-drive-data/warp-drive/pull/10124) chore: mark a few types as private ([@runspired](https://github.com/runspired))
* [#10122](https://github.com/warp-drive-data/warp-drive/pull/10122) chore: simplify ember test app, add spec test lib ([@runspired](https://github.com/runspired))
* [#10116](https://github.com/warp-drive-data/warp-drive/pull/10116) feat: Spec Tests ([@runspired](https://github.com/runspired))
* [#10117](https://github.com/warp-drive-data/warp-drive/pull/10117) chore: port test harness improvements from react branch ([@runspired](https://github.com/runspired))
* [#10115](https://github.com/warp-drive-data/warp-drive/pull/10115) feat: framework agnostic test helpers ([@runspired](https://github.com/runspired))
* [#10114](https://github.com/warp-drive-data/warp-drive/pull/10114) chore: integrate qunit-dom with diagnostic-react ([@runspired](https://github.com/runspired))
* [#10109](https://github.com/warp-drive-data/warp-drive/pull/10109) chore: add react test-app ([@runspired](https://github.com/runspired))

#### Committers: (3)

Chris Thoburn ([@runspired](https://github.com/runspired))
Mehul Kiran Chaudhari ([@MehulKChaudhari](https://github.com/MehulKChaudhari))
Bartlomiej Dudzik ([@BobrImperator](https://github.com/BobrImperator))

## v5.6.0 (2025-07-01)

#### :memo: Documentation

* [#9991](https://github.com/warp-drive-data/warp-drive/pull/9991) chore: improve output of typedoc ([@runspired](https://github.com/runspired))
* [#9989](https://github.com/warp-drive-data/warp-drive/pull/9989) [BREAKING] docs: integrate API docs to the new docs site ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#10034](https://github.com/warp-drive-data/warp-drive/pull/10034) feat: RequestSubscription ([@runspired](https://github.com/runspired))
* [#10011](https://github.com/warp-drive-data/warp-drive/pull/10011) feat: @warp-drive/core/build-config ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9982](https://github.com/warp-drive-data/warp-drive/pull/9982) fix: simplify peer configuration to avoid bringing extra copies of glimmer/validator ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10042](https://github.com/warp-drive-data/warp-drive/pull/10042) chore: upgrade to vite7 ([@runspired](https://github.com/runspired))
* [#10040](https://github.com/warp-drive-data/warp-drive/pull/10040) chore: isolated declarations ([@runspired](https://github.com/runspired))
* [#10039](https://github.com/warp-drive-data/warp-drive/pull/10039) chore: bump pnpm ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.5.0 (2025-05-08)

#### :memo: Documentation

* [#9975](https://github.com/warp-drive-data/warp-drive/pull/9975) types: fixup PolarisMode schema types to check better ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :rocket: Enhancement

* [#9884](https://github.com/warp-drive-data/warp-drive/pull/9884) feat: cache patch operations for relationships and documents ([@runspired](https://github.com/runspired))
* [#9541](https://github.com/warp-drive-data/warp-drive/pull/9541) feat: eslint-plugin-(ember-data|warp-drive) ([@runspired](https://github.com/runspired))
* [#9503](https://github.com/warp-drive-data/warp-drive/pull/9503) feat: request deduping & <Request /> invalidate subscriptions ([@runspired](https://github.com/runspired))
* [#8698](https://github.com/warp-drive-data/warp-drive/pull/8698) feat: DataWorker | robust cross-tab request deduplication and replay ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9647](https://github.com/warp-drive-data/warp-drive/pull/9647) chore: bump range for @ember/test-helpers to include 5.1 ([@runspired](https://github.com/runspired))
* [#9592](https://github.com/warp-drive-data/warp-drive/pull/9592) fix: add ember-source as explicit peer-dep for use of @ember/debug ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9780](https://github.com/warp-drive-data/warp-drive/pull/9780) chore: bump @glimmer/component ([@runspired](https://github.com/runspired))
* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9704](https://github.com/warp-drive-data/warp-drive/pull/9704) internal: fixup diagnostic reporting ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9596](https://github.com/warp-drive-data/warp-drive/pull/9596) chore: Remove unused `--report-unused-disable-directives` flag ([@gitKrystan](https://github.com/gitKrystan))
* [#9515](https://github.com/warp-drive-data/warp-drive/pull/9515) chore: dont crash for non-existent asset requests ([@runspired](https://github.com/runspired))

#### Committers: (3)

Chris Thoburn ([@runspired](https://github.com/runspired))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

## v0.0.0-alpha.71 (2024-06-15)

#### :memo: Documentation

* [#9328](https://github.com/warp-drive-data/warp-drive/pull/9328) chore: update READMEs with status and dist tag info ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9468](https://github.com/warp-drive-data/warp-drive/pull/9468) feat: string utils 🌌  ([@runspired](https://github.com/runspired))
* [#9448](https://github.com/warp-drive-data/warp-drive/pull/9448) feat: impl SchemaService RFC ([@runspired](https://github.com/runspired))
* [#9366](https://github.com/warp-drive-data/warp-drive/pull/9366) feat: typed Model ([@runspired](https://github.com/runspired))
* [#9317](https://github.com/warp-drive-data/warp-drive/pull/9317) feat: ensure data utils work well with legacy relationship proxies ([@runspired](https://github.com/runspired))
* [#9260](https://github.com/warp-drive-data/warp-drive/pull/9260) feat: ember specific data utils ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9383](https://github.com/warp-drive-data/warp-drive/pull/9383) fix: ensure cache-handler clones full errors ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v0.0.0-alpha.9 (2024-02-24)

#### :memo: Documentation

* [#9070](https://github.com/warp-drive-data/warp-drive/pull/9070) docs: fix note notation to make use of github formatting ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9220](https://github.com/warp-drive-data/warp-drive/pull/9220) feat: request infra improvements ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9110](https://github.com/warp-drive-data/warp-drive/pull/9110) Stricter typescript-eslint config ([@gitKrystan](https://github.com/gitKrystan))
* [#9089](https://github.com/warp-drive-data/warp-drive/pull/9089) Add type-checking for packages/unpublished-test-infra ([@gitKrystan](https://github.com/gitKrystan))
* [#9009](https://github.com/warp-drive-data/warp-drive/pull/9009) chore(internal) add @warp-drive/diagnostic/ember ([@runspired](https://github.com/runspired))
* [#9007](https://github.com/warp-drive-data/warp-drive/pull/9007) chore(internal): convert model and adapter tests to use diagnostic ([@runspired](https://github.com/runspired))
* [#8967](https://github.com/warp-drive-data/warp-drive/pull/8967) chore(private): implements a QUnit alternative ([@runspired](https://github.com/runspired))
* [#9084](https://github.com/warp-drive-data/warp-drive/pull/9084) Add import types ([@gitKrystan](https://github.com/gitKrystan))
* [#8989](https://github.com/warp-drive-data/warp-drive/pull/8989) chore(private): concurrent mode ([@runspired](https://github.com/runspired))
* [#9058](https://github.com/warp-drive-data/warp-drive/pull/9058) Switch from eslint-plugin-prettier to running prettier directly ([@gitKrystan](https://github.com/gitKrystan))
* [#9057](https://github.com/warp-drive-data/warp-drive/pull/9057) Add eslint-plugin-n to eslint config for node files ([@gitKrystan](https://github.com/gitKrystan))
* [#9055](https://github.com/warp-drive-data/warp-drive/pull/9055) Fix ESLint for VSCode ([@gitKrystan](https://github.com/gitKrystan))
* [#9051](https://github.com/warp-drive-data/warp-drive/pull/9051) chore: use references for tsc, add checks to schema-record, bun to run scripts ([@runspired](https://github.com/runspired))
* [#9032](https://github.com/warp-drive-data/warp-drive/pull/9032) chore(types): split out lint and type commands to be per-package ([@runspired](https://github.com/runspired))
* [#9050](https://github.com/warp-drive-data/warp-drive/pull/9050) chore: use composite mode for tsc ([@runspired](https://github.com/runspired))
* [#9049](https://github.com/warp-drive-data/warp-drive/pull/9049) chore: incremental tsc builds ([@runspired](https://github.com/runspired))
* [#9046](https://github.com/warp-drive-data/warp-drive/pull/9046) chore: reduce number of things turbo builds for build ([@runspired](https://github.com/runspired))
* [#9006](https://github.com/warp-drive-data/warp-drive/pull/9006) chore (internal): convert builder and request tests to use diagnostic+runner ([@runspired](https://github.com/runspired))
* [#9000](https://github.com/warp-drive-data/warp-drive/pull/9000) feat(private): native test runner ([@runspired](https://github.com/runspired))
* [#8995](https://github.com/warp-drive-data/warp-drive/pull/8995) chore: add @warp-drive/diagnostic docs ([@runspired](https://github.com/runspired))
* [#8987](https://github.com/warp-drive-data/warp-drive/pull/8987) chore: test-harness improvements ([@runspired](https://github.com/runspired))
* [#8972](https://github.com/warp-drive-data/warp-drive/pull/8972) chore: use new test runner for request tests ([@runspired](https://github.com/runspired))
* [#8906](https://github.com/warp-drive-data/warp-drive/pull/8906) feat: expand mock-server capabilities, add to main tests ([@runspired](https://github.com/runspired))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

