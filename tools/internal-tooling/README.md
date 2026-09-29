# @warp-drive/internal-tooling

This internal (private) project provides a number of tooling scripts
for use with the monorepo.

These scripts can be run as bin-scripts from root. They are TypeScript files
run directly by Node (no build step), so they need a Node version that strips
types natively, which the version pinned in `mise.toml` does.

### sync-all

```sh
pnpm sync-all
```

Will run all of the other available scripts.

### sync-logos

```sh
pnpm sync-logos
```

Will sync the logo directory from root to each public package and
ensure that the logos directory is included in published files.

### sync-license

```sh
pnpm sync-license
```

Will sync the LICENSE.md file from root to each public package and
ensure that the license is both set to `MIT` in the package.json and
included in the published files for each package.

### sync-references

```sh
pnpm sync-references
```

Will ensure that `paths` and `references` are both correctly specified
in tsconfig.json for any other workspace package specified by package.json
as a dependency, peer-dependency, or dev-dependency.

Will also ensure the proper settings for composite etc. are in use.

For packages that should emit types (any non-test app package) it will
ensure that the declarationDir is added to the files array in package.json.

### sync-scripts

```sh
pnpm sync-scripts
```

Will ensure that scripts enumerated in package.json which should be the same
throughout the monorepo match expected configuration.

### sync-readme-tables

```sh
pnpm sync-readme-tables
```

Will regenerate the "Compatibility" and "Big List of Versions" tables in the
root README.md from the data in `src/tasks/-data/` and the public workspace
packages.

## How the scripts run

Each `src/sync-*.ts` file is the entry point for one script and can be run
directly with `node src/<script>.ts` from this directory (this is how
`build:pkg` runs `sync-logos` during `pnpm install`).

The `bin` entries point at the small `bin/*.mjs` launchers instead. The
monorepo root installs this package as an injected copy under
`node_modules/.pnpm`, and Node refuses to strip types from `.ts` files under
`node_modules`, so the launchers load the TypeScript sources from the workspace
checkout at `tools/internal-tooling` instead.

## Tests

```sh
pnpm --filter @warp-drive/internal-tooling test
```

The specs in `tests/` run each script with `node --test` against a throwaway
fixture monorepo and assert on the files it writes.
