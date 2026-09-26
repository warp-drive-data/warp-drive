---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_LEGACY_IMPORTS.md
description: >-
  Deprecation flag for importing from the legacy `ember-data/*` paths instead of
  `@ember-data/*`, except `ember-data/store`.
---

# &#x20;DEPRECATE\_LEGACY\_IMPORTS&#x20;

```ts
const DEPRECATE_LEGACY_IMPORTS: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/deprecations.d.ts:209](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/deprecations.d.ts#L209)

Deprecates when importing from `ember-data/*` instead of `@ember-data/*`
in order to prepare for the eventual removal of the legacy `ember-data/*`

All imports from `ember-data/*` should be updated to `@ember-data/*`
except for `ember-data/store`. When you are using `ember-data` (as opposed to
installing the indivudal packages) you should import from `ember-data/store`
instead of `@ember-data/store` in order to receive the appropriate configuration
of defaults.

## Until

6.0
