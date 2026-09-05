# warp-drive Changelog

## v5.9.0 (2026-09-05)

#### :rocket: Enhancement

* [#10866](https://github.com/warp-drive-data/warp-drive/pull/10866) feat(warp-drive): move blueprints generation into the CLI, drop ember-cli-blueprint-test-helpers ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#10458](https://github.com/warp-drive-data/warp-drive/pull/10458) fix: bump build dependencies ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#10955](https://github.com/warp-drive-data/warp-drive/pull/10955) chore(deps): drop now-unused classic typescript devDependency ([@runspired](https://github.com/runspired))
* [#10948](https://github.com/warp-drive-data/warp-drive/pull/10948) chore(types): move all remaining packages to TypeScript 7 for check:types ([@runspired](https://github.com/runspired))
* [#10937](https://github.com/warp-drive-data/warp-drive/pull/10937) build: migrate formatting from prettier to oxfmt ([@runspired](https://github.com/runspired))
* [#10928](https://github.com/warp-drive-data/warp-drive/pull/10928) chore: bump pnpm to 12.0.0, replace Volta with mise ([@runspired](https://github.com/runspired))
* [#10869](https://github.com/warp-drive-data/warp-drive/pull/10869) chore(deps): dedupe ember-source, vite, @types/node, @vue/compiler-sfc, @shikijs/langs, rxjs ([@runspired](https://github.com/runspired))
* [#10776](https://github.com/warp-drive-data/warp-drive/pull/10776) chore(deps): replace chalk with node:util's styleText ([@runspired](https://github.com/runspired))
* [#10729](https://github.com/warp-drive-data/warp-drive/pull/10729) fix: invoke tsdown directly via node to avoid racy bin-shim resolution ([@runspired](https://github.com/runspired))
* [#10696](https://github.com/warp-drive-data/warp-drive/pull/10696) chore(types): drop redundant tsconfig paths, keep references editor-only ([@runspired](https://github.com/runspired))
* [#10691](https://github.com/warp-drive-data/warp-drive/pull/10691) feat: migrate the warp-drive CLI's build to rolldown via tsdown ([@runspired](https://github.com/runspired))
* [#10643](https://github.com/warp-drive-data/warp-drive/pull/10643) feat: migrate @warp-drive/core's build to rolldown via tsdown ([@runspired](https://github.com/runspired))
* [#10459](https://github.com/warp-drive-data/warp-drive/pull/10459) chore: tweak install ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

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

#### :house: Internal

* [#10042](https://github.com/warp-drive-data/warp-drive/pull/10042) chore: upgrade to vite7 ([@runspired](https://github.com/runspired))
* [#10040](https://github.com/warp-drive-data/warp-drive/pull/10040) chore: isolated declarations ([@runspired](https://github.com/runspired))
* [#10039](https://github.com/warp-drive-data/warp-drive/pull/10039) chore: bump pnpm ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

## v5.4.0 (2025-04-11)

#### :memo: Documentation

* [#9610](https://github.com/warp-drive-data/warp-drive/pull/9610) docs: small readme improvement for cli-tool ([@runspired](https://github.com/runspired))

#### :rocket: Enhancement

* [#9541](https://github.com/warp-drive-data/warp-drive/pull/9541) feat: eslint-plugin-(ember-data|warp-drive) ([@runspired](https://github.com/runspired))
* [#9499](https://github.com/warp-drive-data/warp-drive/pull/9499) feat: monorepo support for npx warp-drive ([@runspired](https://github.com/runspired))

#### :house: Internal

* [#9759](https://github.com/warp-drive-data/warp-drive/pull/9759) chore: Improve contributing experience ([@runspired](https://github.com/runspired))
* [#9752](https://github.com/warp-drive-data/warp-drive/pull/9752) chore: tooling upgrades to support WarpDrive package unification ([@runspired](https://github.com/runspired))
* [#9705](https://github.com/warp-drive-data/warp-drive/pull/9705) chore: make diagnostic shutdown safer, use bun for holodeck server ([@runspired](https://github.com/runspired))
* [#9699](https://github.com/warp-drive-data/warp-drive/pull/9699) chore: update to pnpm 10 ([@runspired](https://github.com/runspired))
* [#9629](https://github.com/warp-drive-data/warp-drive/pull/9629) fix: restore * versions and setup publish to not overwrite them ([@runspired](https://github.com/runspired))
* [#9620](https://github.com/warp-drive-data/warp-drive/pull/9620) Starwars ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: (2)

Chris Thoburn ([@runspired](https://github.com/runspired))
[@NullVoxPopuli](https://github.com/NullVoxPopuli)

For the full project changelog see [https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md](https://github.com/warp-drive-data/warp-drive/blob/main/CHANGELOG.md)

## v0.1.0-alpha.8 (2024-06-15)

#### :rocket: Enhancement

* [#9473](https://github.com/warp-drive-data/warp-drive/pull/9473) npx: warp-drive retrofit types@canary 🪄 ([@runspired](https://github.com/runspired))
* [#9471](https://github.com/warp-drive-data/warp-drive/pull/9471) feat: npx warp-drive ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix

* [#9475](https://github.com/warp-drive-data/warp-drive/pull/9475) fix: dont install optional peers if not already present ([@runspired](https://github.com/runspired))

#### Committers: (1)

Chris Thoburn ([@runspired](https://github.com/runspired))

