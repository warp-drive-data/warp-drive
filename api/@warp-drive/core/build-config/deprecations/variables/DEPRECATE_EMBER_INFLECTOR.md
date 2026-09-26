---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/DEPRECATE_EMBER_INFLECTOR.md
description: >-
  Deprecation flag for using ember-inflector for pluralization and
  singularization instead of the `@ember-data/request-utils/string` utilities.
---

# &#x20;DEPRECATE\_EMBER\_INFLECTOR&#x20;

```ts
const DEPRECATE_EMBER_INFLECTOR: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/deprecations.d.ts:486](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/deprecations.d.ts#L486)

Deprecates the use of ember-inflector for pluralization and singularization in favor
of the `@ember-data/request-utils` package.

Rule configuration methods (singular, plural, uncountable, irregular) and
usage methods (singularize, pluralize) are are available as imports from
`@ember-data/request-utils/string`

Notable differences with ember-inflector:

* there cannot be multiple inflector instances with separate rules
* pluralization does not support a count argument
* string caches now default to 10k entries instead of 1k, and this
  size is now configurable. Additionally, the cache is now a LRU cache
  instead of a first-N cache.

This deprecation can be resolved by removing usage of ember-inflector or by using
both ember-inflector and @ember-data/request-utils in parallel and updating your
WarpDrive build config to mark the deprecation as resolved
in ember-cli-build

```js
setConfig(app, __dirname, { deprecations: { DEPRECATE_EMBER_INFLECTOR: false }});
```

## Until

6.0
