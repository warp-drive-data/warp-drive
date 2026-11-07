---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11237/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_LEGACY_IMPORTS.md
description: >-
  Deprecation flag for importing from the legacy `ember-data/*` paths instead of
  `@ember-data/*`, except `ember-data/store`.
---

# &#x20;DEPRECATE_LEGACY_IMPORTS&#x20;

```ts
const DEPRECATE_LEGACY_IMPORTS: boolean;
```

Defined in: [warp-drive-packages/build-config/src/deprecations.ts:213](https://github.com/warp-drive-data/warp-drive/blob/8027fd58bfaedda5917a1a8b9e7444b919ac2fee/warp-drive-packages/build-config/src/deprecations.ts#L213)

Deprecates when importing from `ember-data/*` instead of `@ember-data/*`
in order to prepare for the eventual removal of the legacy `ember-data/*`

All imports from `ember-data/*` should be updated to `@ember-data/*`
except for `ember-data/store`. When you are using `ember-data` (as opposed to
installing the indivudal packages) you should import from `ember-data/store`
instead of `@ember-data/store` in order to receive the appropriate configuration
of defaults.

## Until

6.0
