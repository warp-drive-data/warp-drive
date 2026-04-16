# @ember-data/store Changelog

## v5.8.0 (2025-10-07)

#### :house: Internal

* [#10397](https://github.com/warp-drive-data/warp-drive/pull/10397) chore: begin converting core-tests to diagnostic and vite minimal ([@runspired](https://github.com/runspired))
* [#10349](https://github.com/warp-drive-data/warp-drive/pull/10349) chore: update all emberjs/data links to warp-drive-data/warp-drive ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.7.0 (2025-08-26)

#### :house: Internal

* [#10130](https://github.com/warp-drive-data/warp-drive/pull/10130) chore: bump pnpm version ([@runspired](https://github.com/runspired))
* [#10129](https://github.com/warp-drive-data/warp-drive/pull/10129) chore: bump typescript to 5.9 ([@runspired](https://github.com/runspired))
* [#10124](https://github.com/warp-drive-data/warp-drive/pull/10124) chore: mark a few types as private ([@runspired](https://github.com/runspired))
* [#10083](https://github.com/warp-drive-data/warp-drive/pull/10083) Fix deprecation handling for blueprint/tutorial ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.6.0 (2025-07-01)

#### :memo: Documentation

* [#9995](https://github.com/warp-drive-data/warp-drive/pull/9995) docs: add docs for Checkout, instantiateRecord, teardownRecorod ([@richgt](https://github.com/richgt))
* [#9991](https://github.com/warp-drive-data/warp-drive/pull/9991) chore: improve output of typedoc ([@runspired](https://github.com/runspired))
* [#9989](https://github.com/warp-drive-data/warp-drive/pull/9989) [BREAKING] docs: integrate API docs to the new docs site ([@runspired](https://github.com/runspired))
* [#9983](https://github.com/warp-drive-data/warp-drive/pull/9983) feat: revamp guide, make builder typing easier ([@runspired](https://github.com/runspired))
* [#9940](https://github.com/warp-drive-data/warp-drive/pull/9940) feat: improved manual ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#10011](https://github.com/warp-drive-data/warp-drive/pull/10011) feat: @warp-drive/core/build-config ([@runspired](https://github.com/runspired))
* [#9998](https://github.com/warp-drive-data/warp-drive/pull/9998) feat: extract @ember-data/store => @warp-drive/core ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9982](https://github.com/warp-drive-data/warp-drive/pull/9982) fix: simplify peer configuration to avoid bringing extra copies of glimmer/validator ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10042](https://github.com/warp-drive-data/warp-drive/pull/10042) chore: upgrade to vite7 ([@runspired](https://github.com/runspired))
* [#10040](https://github.com/warp-drive-data/warp-drive/pull/10040) chore: isolated declarations ([@runspired](https://github.com/runspired))
* [#10039](https://github.com/warp-drive-data/warp-drive/pull/10039) chore: bump pnpm ([@runspired](https://github.com/runspired))
* [#9994](https://github.com/warp-drive-data/warp-drive/pull/9994) chore: [@warp-drive/core] migrate @warp-drive/core-types @ember-data/request ([@runspired](https://github.com/runspired))

#### Committers: (2)

Rich Glazerman ([@richgt](https://github.com/richgt))
Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.5.0 (2025-05-08)

#### :memo: Documentation

* [#9975](https://github.com/warp-drive-data/warp-drive/pull/9975) types: fixup PolarisMode schema types to check better ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9968](https://github.com/warp-drive-data/warp-drive/pull/9968) feat: unlock universal 🌌 ([@runspired](https://github.com/runspired))
* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9947](https://github.com/warp-drive-data/warp-drive/pull/9947) fix: dont notify during population if the array is a collection ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))
* [#9964](https://github.com/warp-drive-data/warp-drive/pull/9964) chore: refactor PromiseState and RequestState to prep for @warp-drive/core ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :memo: Documentation

* [#9911](https://github.com/warp-drive-data/warp-drive/pull/9911) Add a URL to the deprecate Store extends EmberObject ([@kategengler](https://github.com/kategengler))
* [#9648](https://github.com/warp-drive-data/warp-drive/pull/9648) docs: cleanup usage pattern for RequestManager configuration on store ([@runspired](https://github.com/runspired))
* [#9586](https://github.com/warp-drive-data/warp-drive/pull/9586) Fix `until` in deprecation warning `ember-data:schema-service-updates` (must be 6.0 instead of 5.0) ([@mkszepp](https://github.com/mkszepp))

#### :rocket: Enhancement

* [#9884](https://github.com/warp-drive-data/warp-drive/pull/9884) feat: cache patch operations for relationships and documents ([@runspired](https://github.com/runspired))
* [#9896](https://github.com/warp-drive-data/warp-drive/pull/9896) feat: whoa debugging ([@runspired](https://github.com/runspired))
* [#9883](https://github.com/warp-drive-data/warp-drive/pull/9883) feat: make documents react to cache updates ([@runspired](https://github.com/runspired))
* [#9769](https://github.com/warp-drive-data/warp-drive/pull/9769) chore: remove restriction on new field kinds being used with legacy mode ([@runspired](https://github.com/runspired))
* [#9766](https://github.com/warp-drive-data/warp-drive/pull/9766) feat: improve debuggability of SchemaRecord, RecordArray and Identifier ([@runspired](https://github.com/runspired))
* [#9757](https://github.com/warp-drive-data/warp-drive/pull/9757) feat: schema type utils ([@runspired](https://github.com/runspired))
* [#9676](https://github.com/warp-drive-data/warp-drive/pull/9676) Feat: hasMany linksMode ([@leoeuclids](https://github.com/leoeuclids))
* [#9686](https://github.com/warp-drive-data/warp-drive/pull/9686) feat: immutable records should show only remote state, make builder types more useful ([@runspired](https://github.com/runspired))
* [#9683](https://github.com/warp-drive-data/warp-drive/pull/9683) feat: runtime logging activation ([@runspired](https://github.com/runspired))
* [#9585](https://github.com/warp-drive-data/warp-drive/pull/9585) chore: stub out linksMode work ([@runspired](https://github.com/runspired))
* [#9541](https://github.com/warp-drive-data/warp-drive/pull/9541) feat: eslint-plugin-(ember-data|warp-drive) ([@runspired](https://github.com/runspired))
* [#9503](https://github.com/warp-drive-data/warp-drive/pull/9503) feat: request deduping & <Request /> invalidate subscriptions ([@runspired](https://github.com/runspired))
* [#8698](https://github.com/warp-drive-data/warp-drive/pull/8698) feat: DataWorker | robust cross-tab request deduplication and replay ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9592](https://github.com/warp-drive-data/warp-drive/pull/9592) fix: add ember-source as explicit peer-dep for use of @ember/debug ([@runspired](https://github.com/runspired))
* [#9583](https://github.com/warp-drive-data/warp-drive/pull/9583) feat|doc|fix: cleanup includes story ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9780](https://github.com/warp-drive-data/warp-drive/pull/9780) chore: bump @glimmer/component ([@runspired](https://github.com/runspired))
* [#9761](https://github.com/warp-drive-data/warp-drive/pull/9761) chore: reduce simple Map/Set ops ([@runspired](https://github.com/runspired))
* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9697](https://github.com/warp-drive-data/warp-drive/pull/9697) chore: [BREAKING to prior alpha/betas] prepare SchemaRecord for stable, lockdown exports ([@runspired](https://github.com/runspired))
* [#9677](https://github.com/warp-drive-data/warp-drive/pull/9677) chore: fixup deprecation-removed test variants ([@runspired](https://github.com/runspired))
* [#9635](https://github.com/warp-drive-data/warp-drive/pull/9635) fix: resort imports to fix lint ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9596](https://github.com/warp-drive-data/warp-drive/pull/9596) chore: Remove unused `--report-unused-disable-directives` flag ([@gitKrystan](https://github.com/gitKrystan))
* [#9509](https://github.com/warp-drive-data/warp-drive/pull/9509) chore: cleanup CacheHandler factoring ([@runspired](https://github.com/runspired))

#### Committers: (6)

Katie Gengler ([@kategengler](https://github.com/kategengler))
Chris Thoburn ([@runspired](https://github.com/runspired))
Markus Sanin ([@mkszepp](https://github.com/mkszepp))
Leo Euclides ([@leoeuclids](https://github.com/leoeuclids))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

## v5.3.4 (2024-06-15)

#### :evergreen_tree: New Deprecation

* [#9403](https://github.com/warp-drive-data/warp-drive/pull/9403) feat: deprecate store extending EmberObject ([@runspired](https://github.com/runspired))

#### :memo: Documentation

* [#9378](https://github.com/warp-drive-data/warp-drive/pull/9378) Update some docs to string ids ([@wagenet](https://github.com/wagenet))
* [#9328](https://github.com/warp-drive-data/warp-drive/pull/9328) chore: update READMEs with status and dist tag info ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9474](https://github.com/warp-drive-data/warp-drive/pull/9474) Improve query types for legacy-compat/builders ([@gitKrystan](https://github.com/gitKrystan))
* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9468](https://github.com/warp-drive-data/warp-drive/pull/9468) feat: string utils 🌌  ([@runspired](https://github.com/runspired))
* [#9407](https://github.com/warp-drive-data/warp-drive/pull/9407) feat: v2 addons ([@runspired](https://github.com/runspired))
* [#9453](https://github.com/warp-drive-data/warp-drive/pull/9453) feat: update SchemaService to reflect RFC updates ([@runspired](https://github.com/runspired))
* [#9448](https://github.com/warp-drive-data/warp-drive/pull/9448) feat: impl SchemaService RFC ([@runspired](https://github.com/runspired))
* [#9450](https://github.com/warp-drive-data/warp-drive/pull/9450) feat: improve typing around Model and createRecord ([@runspired](https://github.com/runspired))
* [#9444](https://github.com/warp-drive-data/warp-drive/pull/9444) feat: rename LifetimesService => CachePolicy for clarity ([@runspired](https://github.com/runspired))
* [#9396](https://github.com/warp-drive-data/warp-drive/pull/9396) fix: Resolve promise types for props passed to `store.createRecord()` ([@seanCodes](https://github.com/seanCodes))
* [#9387](https://github.com/warp-drive-data/warp-drive/pull/9387) feat: better types for legacy store methods ([@runspired](https://github.com/runspired))
* [#9366](https://github.com/warp-drive-data/warp-drive/pull/9366) feat: typed Model ([@runspired](https://github.com/runspired))
* [#9359](https://github.com/warp-drive-data/warp-drive/pull/9359) feat: type checked builders and inferred request types from builders ([@runspired](https://github.com/runspired))
* [#9352](https://github.com/warp-drive-data/warp-drive/pull/9352) feat: make setKeyInfoForResource public ([@runspired](https://github.com/runspired))
* [#9277](https://github.com/warp-drive-data/warp-drive/pull/9277) feat: implement managed object for schemaRecord ([@richgt](https://github.com/richgt))
* [#9319](https://github.com/warp-drive-data/warp-drive/pull/9319) Add @ember-data/legacy-compat/builders ([@gitKrystan](https://github.com/gitKrystan))
* [#9314](https://github.com/warp-drive-data/warp-drive/pull/9314) feat: improve lifetime handling of ad-hoc createRecord requests ([@runspired](https://github.com/runspired))
* [#9260](https://github.com/warp-drive-data/warp-drive/pull/9260) feat: ember specific data utils ([@runspired](https://github.com/runspired))
* [#9249](https://github.com/warp-drive-data/warp-drive/pull/9249) chore: handle declare statements in module rewriting ([@runspired](https://github.com/runspired))
* [#9245](https://github.com/warp-drive-data/warp-drive/pull/9245) feat: add consumer types for Model APIs ([@runspired](https://github.com/runspired))
* [#9244](https://github.com/warp-drive-data/warp-drive/pull/9244) feat: improves consumer-facing store types ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9459](https://github.com/warp-drive-data/warp-drive/pull/9459) fix: ensure cachehandler responses are cast to documents ([@runspired](https://github.com/runspired))
* [#9383](https://github.com/warp-drive-data/warp-drive/pull/9383) fix: ensure cache-handler clones full errors ([@runspired](https://github.com/runspired))
* [#9265](https://github.com/warp-drive-data/warp-drive/pull/9265) feat: Improve config handling for polyfillUUID ([@MehulKChaudhari](https://github.com/MehulKChaudhari))

#### :house: Internal

* [#9476](https://github.com/warp-drive-data/warp-drive/pull/9476) chore: cleanup symbol usage ([@runspired](https://github.com/runspired))
* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))
* [#9392](https://github.com/warp-drive-data/warp-drive/pull/9392) Fix some typos after reading code ([@Baltazore](https://github.com/Baltazore))
* [#9370](https://github.com/warp-drive-data/warp-drive/pull/9370) chore: rename macros ([@runspired](https://github.com/runspired))

#### Committers: (7)

Chris Thoburn ([@runspired](https://github.com/runspired))
Peter Wagenet ([@wagenet](https://github.com/wagenet))
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))
Sean Juarez ([@seanCodes](https://github.com/seanCodes))
Rich Glazerman ([@richgt](https://github.com/richgt))
Mehul Kiran Chaudhari ([@MehulKChaudhari](https://github.com/MehulKChaudhari))
Kirill Shaplyko ([@Baltazore](https://github.com/Baltazore))

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v5.3.1 (2024-02-24)

#### :evergreen_tree: New Deprecation

* [#9189](https://github.com/warp-drive-data/warp-drive/pull/9189) fix: mutating ManyArray should handle duplicates gracefully (with deprecation) ([@gitKrystan](https://github.com/gitKrystan))

#### :memo: Documentation

* [#9162](https://github.com/warp-drive-data/warp-drive/pull/9162) feat: improve store.request documentation ([@runspired](https://github.com/runspired))
* [#9159](https://github.com/warp-drive-data/warp-drive/pull/9159) fix: support full range of json:api for references, update docs ([@runspired](https://github.com/runspired))
* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))
* [#9070](https://github.com/warp-drive-data/warp-drive/pull/9070) docs: fix note notation to make use of github formatting ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9220](https://github.com/warp-drive-data/warp-drive/pull/9220) feat: request infra improvements ([@runspired](https://github.com/runspired))
* [#9163](https://github.com/warp-drive-data/warp-drive/pull/9163) feat: improved lifetimes-service capabilities ([@runspired](https://github.com/runspired))
* [#9159](https://github.com/warp-drive-data/warp-drive/pull/9159) fix: support full range of json:api for references, update docs ([@runspired](https://github.com/runspired))
* [#9094](https://github.com/warp-drive-data/warp-drive/pull/9094) feat: support legacy attribute behaviors in SchemaRecord ([@gitKrystan](https://github.com/gitKrystan))
* [#9095](https://github.com/warp-drive-data/warp-drive/pull/9095) feat (internal): support legacy model behaviors in SchemaRecord legacy mode ([@runspired](https://github.com/runspired))
* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))
* [#8949](https://github.com/warp-drive-data/warp-drive/pull/8949) feat:prepare for universal reactivity ([@runspired](https://github.com/runspired))
* [#8946](https://github.com/warp-drive-data/warp-drive/pull/8946) feat (private): implement resource relationships for SchemaRecord ([@runspired](https://github.com/runspired))
* [#8935](https://github.com/warp-drive-data/warp-drive/pull/8935) feat: (private) implement basic field support for schema-record ([@runspired](https://github.com/runspired))
* [#8921](https://github.com/warp-drive-data/warp-drive/pull/8921) feat: Improved Fetch Errors ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9189](https://github.com/warp-drive-data/warp-drive/pull/9189) fix: mutating ManyArray should handle duplicates gracefully (with deprecation) ([@gitKrystan](https://github.com/gitKrystan))
* [#9183](https://github.com/warp-drive-data/warp-drive/pull/9183) fix: keep a backreference for previously merged identifiers ([@runspired](https://github.com/runspired))
* [#8927](https://github.com/warp-drive-data/warp-drive/pull/8927) fix: live-array delete sync should not clear the set on length match ([@runspired](https://github.com/runspired))
* [#9159](https://github.com/warp-drive-data/warp-drive/pull/9159) fix: support full range of json:api for references, update docs ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9110](https://github.com/warp-drive-data/warp-drive/pull/9110) Stricter typescript-eslint config ([@gitKrystan](https://github.com/gitKrystan))
* [#9058](https://github.com/warp-drive-data/warp-drive/pull/9058) Switch from eslint-plugin-prettier to running prettier directly ([@gitKrystan](https://github.com/gitKrystan))
* [#9057](https://github.com/warp-drive-data/warp-drive/pull/9057) Add eslint-plugin-n to eslint config for node files ([@gitKrystan](https://github.com/gitKrystan))
* [#9055](https://github.com/warp-drive-data/warp-drive/pull/9055) Fix ESLint for VSCode ([@gitKrystan](https://github.com/gitKrystan))
* [#9051](https://github.com/warp-drive-data/warp-drive/pull/9051) chore: use references for tsc, add checks to schema-record, bun to run scripts ([@runspired](https://github.com/runspired))
* [#9032](https://github.com/warp-drive-data/warp-drive/pull/9032) chore(types): split out lint and type commands to be per-package ([@runspired](https://github.com/runspired))
* [#9050](https://github.com/warp-drive-data/warp-drive/pull/9050) chore: use composite mode for tsc ([@runspired](https://github.com/runspired))
* [#9049](https://github.com/warp-drive-data/warp-drive/pull/9049) chore: incremental tsc builds ([@runspired](https://github.com/runspired))
* [#9046](https://github.com/warp-drive-data/warp-drive/pull/9046) chore: reduce number of things turbo builds for build ([@runspired](https://github.com/runspired))
* [#9027](https://github.com/warp-drive-data/warp-drive/pull/9027) chore: improve types for store package ([@runspired](https://github.com/runspired))
* [#9029](https://github.com/warp-drive-data/warp-drive/pull/9029) chore: add @warp-drive/core as home for shared code ([@runspired](https://github.com/runspired))
* [#9028](https://github.com/warp-drive-data/warp-drive/pull/9028) chore: more isolated types ([@runspired](https://github.com/runspired))
* [#9025](https://github.com/warp-drive-data/warp-drive/pull/9025) chore: reconfigure request package type location ([@runspired](https://github.com/runspired))
* [#9021](https://github.com/warp-drive-data/warp-drive/pull/9021) chore: cleanup ember-data/-private types ([@runspired](https://github.com/runspired))
* [#9019](https://github.com/warp-drive-data/warp-drive/pull/9019) chore: make model types strict ([@runspired](https://github.com/runspired))
* [#9016](https://github.com/warp-drive-data/warp-drive/pull/9016) chore: make type-only files strict ([@runspired](https://github.com/runspired))
* [#8931](https://github.com/warp-drive-data/warp-drive/pull/8931) chore: package infra for schema-record ([@runspired](https://github.com/runspired))
* [#8906](https://github.com/warp-drive-data/warp-drive/pull/8906) feat: expand mock-server capabilities, add to main tests ([@runspired](https://github.com/runspired))

#### Committers: (2)

Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))
Chris Thoburn ([@runspired](https://github.com/runspired))

