# @ember-data/request-utils Changelog

## v5.8.0 (2025-10-07)

#### :house: Internal

* [#10349](https://github.com/warp-drive-data/warp-drive/pull/10349) chore: update all emberjs/data links to warp-drive-data/warp-drive ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.7.0 (2025-08-26)

#### :house: Internal

* [#10129](https://github.com/warp-drive-data/warp-drive/pull/10129) chore: bump typescript to 5.9 ([@runspired](https://github.com/runspired))
* [#10124](https://github.com/warp-drive-data/warp-drive/pull/10124) chore: mark a few types as private ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.6.0 (2025-07-01)

#### :memo: Documentation

* [#9991](https://github.com/warp-drive-data/warp-drive/pull/9991) chore: improve output of typedoc ([@runspired](https://github.com/runspired))
* [#9989](https://github.com/warp-drive-data/warp-drive/pull/9989) [BREAKING] docs: integrate API docs to the new docs site ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#10011](https://github.com/warp-drive-data/warp-drive/pull/10011) feat: @warp-drive/core/build-config ([@runspired](https://github.com/runspired))
* [#10002](https://github.com/warp-drive-data/warp-drive/pull/10002) feat: @warp-drive/utilities ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10042](https://github.com/warp-drive-data/warp-drive/pull/10042) chore: upgrade to vite7 ([@runspired](https://github.com/runspired))
* [#10040](https://github.com/warp-drive-data/warp-drive/pull/10040) chore: isolated declarations ([@runspired](https://github.com/runspired))
* [#9994](https://github.com/warp-drive-data/warp-drive/pull/9994) chore: [@warp-drive/core] migrate @warp-drive/core-types @ember-data/request ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.5.0 (2025-05-08)

#### :memo: Documentation

* [#9975](https://github.com/warp-drive-data/warp-drive/pull/9975) types: fixup PolarisMode schema types to check better ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9978](https://github.com/warp-drive-data/warp-drive/pull/9978) feat: constraints based CachePolicy features ([@runspired](https://github.com/runspired))
* [#9977](https://github.com/warp-drive-data/warp-drive/pull/9977) feat: AutoCompress handler ([@runspired](https://github.com/runspired))
* [#9968](https://github.com/warp-drive-data/warp-drive/pull/9968) feat: unlock universal 🌌 ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :rocket: Enhancement

* [#9503](https://github.com/warp-drive-data/warp-drive/pull/9503) feat: request deduping & <Request /> invalidate subscriptions ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9592](https://github.com/warp-drive-data/warp-drive/pull/9592) fix: add ember-source as explicit peer-dep for use of @ember/debug ([@runspired](https://github.com/runspired))
* [#9511](https://github.com/warp-drive-data/warp-drive/pull/9511) Add @ember/string v4 to peerDependencies ([@SergeAstapov](https://github.com/SergeAstapov))
* [#9497](https://github.com/warp-drive-data/warp-drive/pull/9497) fix: dont trust ember-inflector ([@runspired](https://github.com/runspired))
* [#9495](https://github.com/warp-drive-data/warp-drive/pull/9495) fix: setup deprecation support as early as possible, restore inspector support ([@runspired](https://github.com/runspired))
* [#9485](https://github.com/warp-drive-data/warp-drive/pull/9485) fix: update deprecation language for ember-inflector deprecation ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9780](https://github.com/warp-drive-data/warp-drive/pull/9780) chore: bump @glimmer/component ([@runspired](https://github.com/runspired))
* [#9770](https://github.com/warp-drive-data/warp-drive/pull/9770) Widen Peer Range for ember-inflector ([@jrjohnson](https://github.com/jrjohnson))
* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9596](https://github.com/warp-drive-data/warp-drive/pull/9596) chore: Remove unused `--report-unused-disable-directives` flag ([@gitKrystan](https://github.com/gitKrystan))
* [#9519](https://github.com/warp-drive-data/warp-drive/pull/9519) Allow `ember-inflector` v5 as peerDependency & latest `ember-inflector` v4 version ([@mkszepp](https://github.com/mkszepp))

#### Committers: (6)

Chris Thoburn ([@runspired](https://github.com/runspired))
Sergey Astapov ([@SergeAstapov](https://github.com/SergeAstapov))
Jon Johnson ([@jrjohnson](https://github.com/jrjohnson))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))
Markus Sanin ([@mkszepp](https://github.com/mkszepp))

## v5.3.4 (2024-06-15)

#### :evergreen_tree: New Deprecation

* [#9479](https://github.com/warp-drive-data/warp-drive/pull/9479) feat: support migration path for ember-inflector usage ([@runspired](https://github.com/runspired))

#### :memo: Documentation

* [#9328](https://github.com/warp-drive-data/warp-drive/pull/9328) chore: update READMEs with status and dist tag info ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9468](https://github.com/warp-drive-data/warp-drive/pull/9468) feat: string utils 🌌  ([@runspired](https://github.com/runspired))
* [#9407](https://github.com/warp-drive-data/warp-drive/pull/9407) feat: v2 addons ([@runspired](https://github.com/runspired))
* [#9444](https://github.com/warp-drive-data/warp-drive/pull/9444) feat: rename LifetimesService => CachePolicy for clarity ([@runspired](https://github.com/runspired))
* [#9366](https://github.com/warp-drive-data/warp-drive/pull/9366) feat: typed Model ([@runspired](https://github.com/runspired))
* [#9314](https://github.com/warp-drive-data/warp-drive/pull/9314) feat: improve lifetime handling of ad-hoc createRecord requests ([@runspired](https://github.com/runspired))
* [#9260](https://github.com/warp-drive-data/warp-drive/pull/9260) feat: ember specific data utils ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v5.3.1 (2024-02-24)

#### :memo: Documentation

* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9220](https://github.com/warp-drive-data/warp-drive/pull/9220) feat: request infra improvements ([@runspired](https://github.com/runspired))
* [#9163](https://github.com/warp-drive-data/warp-drive/pull/9163) feat: improved lifetimes-service capabilities ([@runspired](https://github.com/runspired))
* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))
* [#9069](https://github.com/warp-drive-data/warp-drive/pull/9069) feat: Improve extensibility ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9164](https://github.com/warp-drive-data/warp-drive/pull/9164) fix: url configuration should respect / for host and error more meaningfully when invalid ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9058](https://github.com/warp-drive-data/warp-drive/pull/9058) Switch from eslint-plugin-prettier to running prettier directly ([@gitKrystan](https://github.com/gitKrystan))
* [#9057](https://github.com/warp-drive-data/warp-drive/pull/9057) Add eslint-plugin-n to eslint config for node files ([@gitKrystan](https://github.com/gitKrystan))
* [#9055](https://github.com/warp-drive-data/warp-drive/pull/9055) Fix ESLint for VSCode ([@gitKrystan](https://github.com/gitKrystan))
* [#9051](https://github.com/warp-drive-data/warp-drive/pull/9051) chore: use references for tsc, add checks to schema-record, bun to run scripts ([@runspired](https://github.com/runspired))
* [#9032](https://github.com/warp-drive-data/warp-drive/pull/9032) chore(types): split out lint and type commands to be per-package ([@runspired](https://github.com/runspired))
* [#9050](https://github.com/warp-drive-data/warp-drive/pull/9050) chore: use composite mode for tsc ([@runspired](https://github.com/runspired))
* [#9049](https://github.com/warp-drive-data/warp-drive/pull/9049) chore: incremental tsc builds ([@runspired](https://github.com/runspired))
* [#9046](https://github.com/warp-drive-data/warp-drive/pull/9046) chore: reduce number of things turbo builds for build ([@runspired](https://github.com/runspired))
* [#9025](https://github.com/warp-drive-data/warp-drive/pull/9025) chore: reconfigure request package type location ([@runspired](https://github.com/runspired))
* [#8931](https://github.com/warp-drive-data/warp-drive/pull/8931) chore: package infra for schema-record ([@runspired](https://github.com/runspired))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

