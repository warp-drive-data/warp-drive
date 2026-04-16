# @ember-data/model Changelog

## v5.8.0 (2025-10-07)

#### :house: Internal

* [#10349](https://github.com/warp-drive-data/warp-drive/pull/10349) chore: update all emberjs/data links to warp-drive-data/warp-drive ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.7.0 (2025-08-26)

#### :house: Internal

* [#10130](https://github.com/warp-drive-data/warp-drive/pull/10130) chore: bump pnpm version ([@runspired](https://github.com/runspired))
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
* [#10005](https://github.com/warp-drive-data/warp-drive/pull/10005) feat: @warp-drive/legacy ([@runspired](https://github.com/runspired))

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
* [#9971](https://github.com/warp-drive-data/warp-drive/pull/9971) docs: add more documentation and type utils around LegacyMode and potential migration paths ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9971](https://github.com/warp-drive-data/warp-drive/pull/9971) docs: add more documentation and type utils around LegacyMode and potential migration paths ([@runspired](https://github.com/runspired))
* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))
* [#9964](https://github.com/warp-drive-data/warp-drive/pull/9964) chore: refactor PromiseState and RequestState to prep for @warp-drive/core ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :memo: Documentation

* [#9586](https://github.com/warp-drive-data/warp-drive/pull/9586) Fix `until` in deprecation warning `ember-data:schema-service-updates` (must be 6.0 instead of 5.0) ([@mkszepp](https://github.com/mkszepp))

#### :rocket: Enhancement

* [#9896](https://github.com/warp-drive-data/warp-drive/pull/9896) feat: whoa debugging ([@runspired](https://github.com/runspired))
* [#9883](https://github.com/warp-drive-data/warp-drive/pull/9883) feat: make documents react to cache updates ([@runspired](https://github.com/runspired))
* [#9769](https://github.com/warp-drive-data/warp-drive/pull/9769) chore: remove restriction on new field kinds being used with legacy mode ([@runspired](https://github.com/runspired))
* [#9757](https://github.com/warp-drive-data/warp-drive/pull/9757) feat: schema type utils ([@runspired](https://github.com/runspired))
* [#9676](https://github.com/warp-drive-data/warp-drive/pull/9676) Feat: hasMany linksMode ([@leoeuclids](https://github.com/leoeuclids))
* [#9585](https://github.com/warp-drive-data/warp-drive/pull/9585) chore: stub out linksMode work ([@runspired](https://github.com/runspired))
* [#9541](https://github.com/warp-drive-data/warp-drive/pull/9541) feat: eslint-plugin-(ember-data|warp-drive) ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9698](https://github.com/warp-drive-data/warp-drive/pull/9698) fix: Don't notify changes for attributes not registered with the schema ([@gitKrystan](https://github.com/gitKrystan))
* [#9592](https://github.com/warp-drive-data/warp-drive/pull/9592) fix: add ember-source as explicit peer-dep for use of @ember/debug ([@runspired](https://github.com/runspired))
* [#9566](https://github.com/warp-drive-data/warp-drive/pull/9566) fix: attr should support transforms with union serialized types ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9780](https://github.com/warp-drive-data/warp-drive/pull/9780) chore: bump @glimmer/component ([@runspired](https://github.com/runspired))
* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9596](https://github.com/warp-drive-data/warp-drive/pull/9596) chore: Remove unused `--report-unused-disable-directives` flag ([@gitKrystan](https://github.com/gitKrystan))
* [#9490](https://github.com/warp-drive-data/warp-drive/pull/9490) Add export point for direct export of blueprints ([@Baltazore](https://github.com/Baltazore))

#### Committers: (6)

Markus Sanin ([@mkszepp](https://github.com/mkszepp))
Chris Thoburn ([@runspired](https://github.com/runspired))
Leo Euclides ([@leoeuclids](https://github.com/leoeuclids))
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)
Kirill Shaplyko ([@Baltazore](https://github.com/Baltazore))

## v5.3.4 (2024-06-15)

#### :memo: Documentation

* [#9328](https://github.com/warp-drive-data/warp-drive/pull/9328) chore: update READMEs with status and dist tag info ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9468](https://github.com/warp-drive-data/warp-drive/pull/9468) feat: string utils 🌌  ([@runspired](https://github.com/runspired))
* [#9464](https://github.com/warp-drive-data/warp-drive/pull/9464) feat: implement support for legacy hasMany and belongsTo relationship reads ([@runspired](https://github.com/runspired))
* [#9407](https://github.com/warp-drive-data/warp-drive/pull/9407) feat: v2 addons ([@runspired](https://github.com/runspired))
* [#9453](https://github.com/warp-drive-data/warp-drive/pull/9453) feat: update SchemaService to reflect RFC updates ([@runspired](https://github.com/runspired))
* [#9448](https://github.com/warp-drive-data/warp-drive/pull/9448) feat: impl SchemaService RFC ([@runspired](https://github.com/runspired))
* [#9450](https://github.com/warp-drive-data/warp-drive/pull/9450) feat: improve typing around Model and createRecord ([@runspired](https://github.com/runspired))
* [#9387](https://github.com/warp-drive-data/warp-drive/pull/9387) feat: better types for legacy store methods ([@runspired](https://github.com/runspired))
* [#9366](https://github.com/warp-drive-data/warp-drive/pull/9366) feat: typed Model ([@runspired](https://github.com/runspired))
* [#9317](https://github.com/warp-drive-data/warp-drive/pull/9317) feat: ensure data utils work well with legacy relationship proxies ([@runspired](https://github.com/runspired))
* [#9260](https://github.com/warp-drive-data/warp-drive/pull/9260) feat: ember specific data utils ([@runspired](https://github.com/runspired))
* [#9256](https://github.com/warp-drive-data/warp-drive/pull/9256) feat: improve alpha types support ([@runspired](https://github.com/runspired))
* [#9250](https://github.com/warp-drive-data/warp-drive/pull/9250) feat: fix types for legacy decorator syntax ([@runspired](https://github.com/runspired))
* [#9249](https://github.com/warp-drive-data/warp-drive/pull/9249) chore: handle declare statements in module rewriting ([@runspired](https://github.com/runspired))
* [#9245](https://github.com/warp-drive-data/warp-drive/pull/9245) feat: add consumer types for Model APIs ([@runspired](https://github.com/runspired))
* [#9244](https://github.com/warp-drive-data/warp-drive/pull/9244) feat: improves consumer-facing store types ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9265](https://github.com/warp-drive-data/warp-drive/pull/9265) feat: Improve config handling for polyfillUUID ([@MehulKChaudhari](https://github.com/MehulKChaudhari))

#### :house: Internal

* [#9476](https://github.com/warp-drive-data/warp-drive/pull/9476) chore: cleanup symbol usage ([@runspired](https://github.com/runspired))
* [#9463](https://github.com/warp-drive-data/warp-drive/pull/9463) types: ManyArray => HasMany ([@runspired](https://github.com/runspired))
* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))
* [#9370](https://github.com/warp-drive-data/warp-drive/pull/9370) chore: rename macros ([@runspired](https://github.com/runspired))
* [#9303](https://github.com/warp-drive-data/warp-drive/pull/9303) infra: setup mirror and types publishing ([@runspired](https://github.com/runspired))
* [#9279](https://github.com/warp-drive-data/warp-drive/pull/9279) types: branded transforms and improve types needed for serializers ([@runspired](https://github.com/runspired))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
Mehul Kiran Chaudhari ([@MehulKChaudhari](https://github.com/MehulKChaudhari))

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v5.3.1 (2024-02-24)

#### :evergreen_tree: New Deprecation

* [#9189](https://github.com/warp-drive-data/warp-drive/pull/9189) fix: mutating ManyArray should handle duplicates gracefully (with deprecation) ([@gitKrystan](https://github.com/gitKrystan))

#### :memo: Documentation

* [#9159](https://github.com/warp-drive-data/warp-drive/pull/9159) fix: support full range of json:api for references, update docs ([@runspired](https://github.com/runspired))
* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9220](https://github.com/warp-drive-data/warp-drive/pull/9220) feat: request infra improvements ([@runspired](https://github.com/runspired))
* [#9159](https://github.com/warp-drive-data/warp-drive/pull/9159) fix: support full range of json:api for references, update docs ([@runspired](https://github.com/runspired))
* [#9094](https://github.com/warp-drive-data/warp-drive/pull/9094) feat: support legacy attribute behaviors in SchemaRecord ([@gitKrystan](https://github.com/gitKrystan))
* [#9095](https://github.com/warp-drive-data/warp-drive/pull/9095) feat (internal): support legacy model behaviors in SchemaRecord legacy mode ([@runspired](https://github.com/runspired))
* [#9072](https://github.com/warp-drive-data/warp-drive/pull/9072) feat: advanced JSON:API queries & basic request example ([@runspired](https://github.com/runspired))
* [#8949](https://github.com/warp-drive-data/warp-drive/pull/8949) feat:prepare for universal reactivity ([@runspired](https://github.com/runspired))
* [#8935](https://github.com/warp-drive-data/warp-drive/pull/8935) feat: (private) implement basic field support for schema-record ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9189](https://github.com/warp-drive-data/warp-drive/pull/9189) fix: mutating ManyArray should handle duplicates gracefully (with deprecation) ([@gitKrystan](https://github.com/gitKrystan))
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
* [#9029](https://github.com/warp-drive-data/warp-drive/pull/9029) chore: add @warp-drive/core as home for shared code ([@runspired](https://github.com/runspired))
* [#9028](https://github.com/warp-drive-data/warp-drive/pull/9028) chore: more isolated types ([@runspired](https://github.com/runspired))
* [#9025](https://github.com/warp-drive-data/warp-drive/pull/9025) chore: reconfigure request package type location ([@runspired](https://github.com/runspired))
* [#9021](https://github.com/warp-drive-data/warp-drive/pull/9021) chore: cleanup ember-data/-private types ([@runspired](https://github.com/runspired))
* [#9019](https://github.com/warp-drive-data/warp-drive/pull/9019) chore: make model types strict ([@runspired](https://github.com/runspired))
* [#9006](https://github.com/warp-drive-data/warp-drive/pull/9006) chore (internal): convert builder and request tests to use diagnostic+runner ([@runspired](https://github.com/runspired))
* [#8931](https://github.com/warp-drive-data/warp-drive/pull/8931) chore: package infra for schema-record ([@runspired](https://github.com/runspired))
* [#8930](https://github.com/warp-drive-data/warp-drive/pull/8930) chore: get last request for any record on instantiation ([@runspired](https://github.com/runspired))

#### Committers: (2)

Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))
Chris Thoburn ([@runspired](https://github.com/runspired))

