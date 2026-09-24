# @ember-data/codemods Changelog

## v5.9.0 (2026-09-05)

#### :memo: Documentation

* [#10501](https://github.com/warp-drive-data/warp-drive/pull/10501) chore(codemods): add codemods guide documentation ([@BobrImperator](https://github.com/BobrImperator))

#### :rocket: Enhancement

* [#10506](https://github.com/warp-drive-data/warp-drive/pull/10506) feat(codemods): add withDefaults to the warpDriveImports configuration ([@BobrImperator](https://github.com/BobrImperator))
* [#10466](https://github.com/warp-drive-data/warp-drive/pull/10466) codemods: model-to-schema migration codemod ([@BobrImperator](https://github.com/BobrImperator))

#### :bug: Bug Fix

* [#10949](https://github.com/warp-drive-data/warp-drive/pull/10949) fix(codemods): distribute the CLI as a portable node bundle ([@runspired](https://github.com/runspired))
* [#10501](https://github.com/warp-drive-data/warp-drive/pull/10501) chore(codemods): add codemods guide documentation ([@BobrImperator](https://github.com/BobrImperator))
* [#10500](https://github.com/warp-drive-data/warp-drive/pull/10500) fix(deploy): @ember-data/codemods fails on different platforms  ([@BobrImperator](https://github.com/BobrImperator))
* [#10497](https://github.com/warp-drive-data/warp-drive/pull/10497) fix(codemods): resolve eslint errors in schema-migration ([@richgt](https://github.com/richgt))
* [#10458](https://github.com/warp-drive-data/warp-drive/pull/10458) fix: bump build dependencies ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10955](https://github.com/warp-drive-data/warp-drive/pull/10955) chore(deps): drop now-unused classic typescript devDependency ([@runspired](https://github.com/runspired))
* [#10948](https://github.com/warp-drive-data/warp-drive/pull/10948) chore(types): move all remaining packages to TypeScript 7 for check:types ([@runspired](https://github.com/runspired))
* [#10928](https://github.com/warp-drive-data/warp-drive/pull/10928) chore: bump pnpm to 12.0.0, replace Volta with mise ([@runspired](https://github.com/runspired))
* [#10884](https://github.com/warp-drive-data/warp-drive/pull/10884) fix(deps): bump eslint to v10 and typescript-eslint to ^8.67 together ([@runspired](https://github.com/runspired))
* [#10869](https://github.com/warp-drive-data/warp-drive/pull/10869) chore(deps): dedupe ember-source, vite, @types/node, @vue/compiler-sfc, @shikijs/langs, rxjs ([@runspired](https://github.com/runspired))
* [#10838](https://github.com/warp-drive-data/warp-drive/pull/10838) chore(deps): drop tsx from tests/codemods in favor of node's native TS support ([@runspired](https://github.com/runspired))
* [#10791](https://github.com/warp-drive-data/warp-drive/pull/10791) chore(deps): remove glob and globby, use node:fs's built-in glob ([@runspired](https://github.com/runspired))
* [#10778](https://github.com/warp-drive-data/warp-drive/pull/10778) chore(deps): remove dead url/zlib shims, replace tmp/strip-ansi with builtins ([@runspired](https://github.com/runspired))
* [#10776](https://github.com/warp-drive-data/warp-drive/pull/10776) chore(deps): replace chalk with node:util's styleText ([@runspired](https://github.com/runspired))
* [#10773](https://github.com/warp-drive-data/warp-drive/pull/10773) chore(deps): dedupe lodash, caniuse-lite, rollup, and babel across the workspace ([@runspired](https://github.com/runspired))
* [#10696](https://github.com/warp-drive-data/warp-drive/pull/10696) chore(types): drop redundant tsconfig paths, keep references editor-only ([@runspired](https://github.com/runspired))
* [#10497](https://github.com/warp-drive-data/warp-drive/pull/10497) fix(codemods): resolve eslint errors in schema-migration ([@richgt](https://github.com/richgt))
* [#10486](https://github.com/warp-drive-data/warp-drive/pull/10486) feat(codemods): log what and why files were skipped ([@BobrImperator](https://github.com/BobrImperator))
* [#10485](https://github.com/warp-drive-data/warp-drive/pull/10485) refactor(codemods): use the existing file parsing utility ([@BobrImperator](https://github.com/BobrImperator))
* [#10484](https://github.com/warp-drive-data/warp-drive/pull/10484) refactor(codemods): remove extraenous logger implementation ([@BobrImperator](https://github.com/BobrImperator))
* [#10481](https://github.com/warp-drive-data/warp-drive/pull/10481) refactor(codemods): deduplicate interface generation ([@BobrImperator](https://github.com/BobrImperator))
* [#10480](https://github.com/warp-drive-data/warp-drive/pull/10480) refactor(codemods): small cleanups ([@BobrImperator](https://github.com/BobrImperator))
* [#10479](https://github.com/warp-drive-data/warp-drive/pull/10479) feat(codemods): Publishing `@ember-data/codemods` ([@BobrImperator](https://github.com/BobrImperator))
* [#10459](https://github.com/warp-drive-data/warp-drive/pull/10459) chore: tweak install ([@runspired](https://github.com/runspired))

#### Committers: (3)

Bartlomiej Dudzik ([@BobrImperator](https://github.com/BobrImperator))
Chris Thoburn ([@runspired](https://github.com/runspired))
Rich Glazerman ([@richgt](https://github.com/richgt))

## v5.8.0 (2025-10-07)

#### :rocket: Enhancement

* [#10384](https://github.com/warp-drive-data/warp-drive/pull/10384) Schema Codemod ([@wagenet](https://github.com/wagenet))

#### :bug: Bug Fix

* [#10393](https://github.com/warp-drive-data/warp-drive/pull/10393) fix: improve docs and make peek mutation safe ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10391](https://github.com/warp-drive-data/warp-drive/pull/10391) Update LegacyCompatBuildersSourceValue to WarpDrive source path ([@Baltazore](https://github.com/Baltazore))
* [#10349](https://github.com/warp-drive-data/warp-drive/pull/10349) chore: update all emberjs/data links to warp-drive-data/warp-drive ([@runspired](https://github.com/runspired))

#### Committers: (3)

Peter Wagenet ([@wagenet](https://github.com/wagenet))
Chris Thoburn ([@runspired](https://github.com/runspired))
Kirill Shaplyko ([@Baltazore](https://github.com/Baltazore))

## v5.7.0 (2025-08-26)

#### :house: Internal

* [#10130](https://github.com/warp-drive-data/warp-drive/pull/10130) chore: bump pnpm version ([@runspired](https://github.com/runspired))
* [#10129](https://github.com/warp-drive-data/warp-drive/pull/10129) chore: bump typescript to 5.9 ([@runspired](https://github.com/runspired))
* [#10124](https://github.com/warp-drive-data/warp-drive/pull/10124) chore: mark a few types as private ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.6.0 (2025-07-01)

#### :memo: Documentation

* [#9989](https://github.com/warp-drive-data/warp-drive/pull/9989) [BREAKING] docs: integrate API docs to the new docs site ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10039](https://github.com/warp-drive-data/warp-drive/pull/10039) chore: bump pnpm ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v5.4.0 (2025-04-11)

#### :rocket: Enhancement

* [#9541](https://github.com/warp-drive-data/warp-drive/pull/9541) feat: eslint-plugin-(ember-data|warp-drive) ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9633](https://github.com/warp-drive-data/warp-drive/pull/9633) Add smoke-tests for types, build, etc  ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :house: Internal

* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9753](https://github.com/warp-drive-data/warp-drive/pull/9753) chore: More upgrades to monorepo tooling ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
* [#9596](https://github.com/warp-drive-data/warp-drive/pull/9596) chore: Remove unused `--report-unused-disable-directives` flag ([@gitKrystan](https://github.com/gitKrystan))

#### Committers: (3)

Chris Thoburn ([@runspired](https://github.com/runspired))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

## v5.3.4 (2024-06-15)

#### :rocket: Enhancement

* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))
* [#9343](https://github.com/warp-drive-data/warp-drive/pull/9343) @ember-data/codemods package ([@gitKrystan](https://github.com/gitKrystan))

#### :house: Internal

* [#9292](https://github.com/warp-drive-data/warp-drive/pull/9292) feat: add new build-config package ([@runspired](https://github.com/runspired))
* [#9398](https://github.com/warp-drive-data/warp-drive/pull/9398) chore: dont --compile during prepack ([@runspired](https://github.com/runspired))
* [#9397](https://github.com/warp-drive-data/warp-drive/pull/9397) chore: fixup publish for @ember-data/codemods ([@runspired](https://github.com/runspired))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
Krystan HuffMenne ([@gitKrystan](https://github.com/gitKrystan))

