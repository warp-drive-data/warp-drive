# @warp-drive/build-config Changelog

## v5.6.0 (2025-07-01)

#### :memo: Documentation

* [#9991](https://github.com/warp-drive-data/warp-drive/pull/9991) chore: improve output of typedoc ([@runspired](https://github.com/runspired))
* [#9989](https://github.com/warp-drive-data/warp-drive/pull/9989) [BREAKING] docs: integrate API docs to the new docs site ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9993](https://github.com/warp-drive-data/warp-drive/pull/9993) chore: prepare more infra for @warp-drive/core package ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.5.0 (2025-05-08)

#### :memo: Documentation

* [#9976](https://github.com/warp-drive-data/warp-drive/pull/9976) docs: add more to the debugging guide ([@runspired](https://github.com/runspired))
* [#9975](https://github.com/warp-drive-data/warp-drive/pull/9975) types: fixup PolarisMode schema types to check better ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9978](https://github.com/warp-drive-data/warp-drive/pull/9978) feat: constraints based CachePolicy features ([@runspired](https://github.com/runspired))
* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9965](https://github.com/warp-drive-data/warp-drive/pull/9965) feat: universal reactivity hooks ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :memo: Documentation

* [#9777](https://github.com/warp-drive-data/warp-drive/pull/9777) docs: update overviews with recent library improvements ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9921](https://github.com/warp-drive-data/warp-drive/pull/9921) Support build-config being used outside of ember ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9884](https://github.com/warp-drive-data/warp-drive/pull/9884) feat: cache patch operations for relationships and documents ([@runspired](https://github.com/runspired))
* [#9896](https://github.com/warp-drive-data/warp-drive/pull/9896) feat: whoa debugging ([@runspired](https://github.com/runspired))
* [#9767](https://github.com/warp-drive-data/warp-drive/pull/9767) feat: persist runtime config ([@runspired](https://github.com/runspired))
* [#9683](https://github.com/warp-drive-data/warp-drive/pull/9683) feat: runtime logging activation ([@runspired](https://github.com/runspired))
* [#9530](https://github.com/warp-drive-data/warp-drive/pull/9530) feat: <:idle> state for Requests ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9637](https://github.com/warp-drive-data/warp-drive/pull/9637) fix: ensure v5 deprecations are resolvable ([@runspired](https://github.com/runspired))
* [#9608](https://github.com/warp-drive-data/warp-drive/pull/9608) fix: restore individual flag customizations for deprecation stripping ([@runspired](https://github.com/runspired))
* [#9530](https://github.com/warp-drive-data/warp-drive/pull/9530) feat: <:idle> state for Requests ([@runspired](https://github.com/runspired))
* [#9495](https://github.com/warp-drive-data/warp-drive/pull/9495) fix: setup deprecation support as early as possible, restore inspector support ([@runspired](https://github.com/runspired))
* [#9492](https://github.com/warp-drive-data/warp-drive/pull/9492) fix: windows builds ([@runspired](https://github.com/runspired))
* [#9485](https://github.com/warp-drive-data/warp-drive/pull/9485) fix: update deprecation language for ember-inflector deprecation ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9919](https://github.com/warp-drive-data/warp-drive/pull/9919) chore: silence deprecation, attempt to fix CI ([@runspired](https://github.com/runspired))
* [#9761](https://github.com/warp-drive-data/warp-drive/pull/9761) chore: reduce simple Map/Set ops ([@runspired](https://github.com/runspired))
* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9749](https://github.com/warp-drive-data/warp-drive/pull/9749) chore: update perf suite ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)

## v0.0.0-alpha.22 (2024-06-15)

#### :evergreen_tree: New Deprecation

* [#9479](https://github.com/warp-drive-data/warp-drive/pull/9479) feat: support migration path for ember-inflector usage ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9448](https://github.com/warp-drive-data/warp-drive/pull/9448) feat: impl SchemaService RFC ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9455](https://github.com/warp-drive-data/warp-drive/pull/9455) fix: config version lookup needs to be project location aware ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9477](https://github.com/warp-drive-data/warp-drive/pull/9477) fix: add deprecation and avoid breaking configs ([@runspired](https://github.com/runspired))
* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

