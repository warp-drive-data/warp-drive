---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_LEGACY_IMPORTS.md
description: >-
  Deprecation flag for importing from the legacy `ember-data/*` paths instead of
  `@ember-data/*`, except `ember-data/store`.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;DEPRECATE\_LEGACY\_IMPORTS&#x20;

```ts
const DEPRECATE_LEGACY_IMPORTS: boolean = true;
```

Defined in: [deprecations.ts:213](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/build-config/src/deprecations.ts#L213)

Deprecates when importing from `ember-data/*` instead of `@ember-data/*`
in order to prepare for the eventual removal of the legacy `ember-data/*`

All imports from `ember-data/*` should be updated to `@ember-data/*`
except for `ember-data/store`. When you are using `ember-data` (as opposed to
installing the indivudal packages) you should import from `ember-data/store`
instead of `@ember-data/store` in order to receive the appropriate configuration
of defaults.

## Until

6.0
