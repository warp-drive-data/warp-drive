# Public exports mapping

`no-legacy-imports` in `eslint-plugin-warp-drive` rewrites imports from the EmberData 5.5
packages to the `@warp-drive/*` modules that hold those tokens today. The rule reads one file for
that, `packages/eslint-plugin-warp-drive/src/legacy-import-mapping.json`. This directory derives
that file from the package sources.

The legacy packages in `packages/` are shims. Each one re-exports from `warp-drive-packages/`, and
the compiler checks those re-exports on every build. `resolve.mjs` follows every token that was
public in 5.5 through those re-exports and records where it ends up. The list of 5.5 tokens is
`public-exports-mapping-5.5.json`, a scan of the `v5.5.0` tag that stays fixed as the contract.

## Regenerate the mapping

Run this after any change to a legacy package's exports, then commit the result:

```sh
node scripts/public-exports-mapping/resolve.mjs
```

It prints one line, for example `499 tokens: 434 rules, 16 local, 49 lost`. The three counts
sum to the number of 5.5 tokens.

## Check the mapping

CI runs this in the `lint` job. The check regenerates the mapping in memory and fails when the
committed file differs:

```sh
pnpm lint:public-exports
```

It prints a unified diff. To fix a failure, regenerate the mapping and commit the diff.

## Regenerate the 5.5 snapshot

You only need this if the scanner in `generate.mjs` changes. The snapshot describes the tree at
tag `v5.5.0`, which kept its packages under `packages/` with `vite.config.mjs` entry points:

```sh
tmp=$(mktemp -d)
git archive v5.5.0 packages | tar -x -C "$tmp"
node scripts/public-exports-mapping/generate.mjs --config vite --root "$tmp" \
	--out scripts/public-exports-mapping/public-exports-mapping-5.5.json
```

A scan of an unchanged tree reproduces the committed file byte for byte.

## Read an entry with no replacement

Every 5.5 token appears in the mapping. A token with `"replacement": null` carries a `reason`:

- `"lost"`. The legacy package no longer exposes the token. The rule reports such an import as
  unmapped and leaves it alone. Restoring the export in the legacy package turns the entry back
  into a rule on the next regeneration.
- `"local"`. The legacy package declares the token itself instead of re-exporting it, so no
  `@warp-drive/*` module stands in for it. The rule reports such an import as unmapped.
