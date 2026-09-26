---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/build-config/functions/setConfig.md
description: >-
  Applies a WarpDrive build config through `@embroider/macros`, controlling env
  behavior, logging, deprecated-code stripping, and canary features.
---

# &#x20;setConfig()

```ts
function setConfig(macros: object, config: WarpDriveConfig): void;
function setConfig(
   context: object, 
   appRoot: string, 
   config: WarpDriveConfig
): void;
```

## Call Signature

```ts
function setConfig(macros: object, config: WarpDriveConfig): void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/index.d.ts:210](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/index.d.ts#L210)

Sets the build configuration for WarpDrive that ensures
environment specific behaviors are activated/deactivated
and enables adjusting log instrumentation, removing code
that supports deprecated features, enabling canary features
and enabling/disabling optional features.

The library uses [@embroider/macros](https://www.npmjs.com/package/@embroider/macros)
to perform this final configuration code transform.

This is a low level API for configuring WarpDrive. If your
project does not use `@embroider/macros` then you should use
[babelPlugin](babelPlugin.md) instead of this function.

### Example

```ts
import { setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const Macros = buildMacros({
  configure: (config) => {
    setConfig(config, {
      compatWith: '5.6'
    });
  },
});

export default {
  plugins: [
    // babel-plugin-debug-macros is temporarily needed
    // to convert deprecation/warn calls into console.warn
    [
      'babel-plugin-debug-macros',
      {
        flags: [],

        debugTools: {
          isDebug: true,
          source: '@ember/debug',
          assertPredicateIndex: 1,
        },
      },
      'ember-data-specific-macros-stripping-test',
    ],
    ...Macros.babelMacros,
  ],
};
```

### Parameters

#### macros

`object`

#### config

[`WarpDriveConfig`](../types/WarpDriveConfig.md)

### Returns

`void`

## Call Signature

```ts
function setConfig(
   context: object, 
   appRoot: string, 
   config: WarpDriveConfig
): void;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/index.d.ts:211](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/index.d.ts#L211)

Sets the build configuration for WarpDrive that ensures
environment specific behaviors are activated/deactivated
and enables adjusting log instrumentation, removing code
that supports deprecated features, enabling canary features
and enabling/disabling optional features.

The library uses [@embroider/macros](https://www.npmjs.com/package/@embroider/macros)
to perform this final configuration code transform.

This is a low level API for configuring WarpDrive. If your
project does not use `@embroider/macros` then you should use
[babelPlugin](babelPlugin.md) instead of this function.

### Example

```ts
import { setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const Macros = buildMacros({
  configure: (config) => {
    setConfig(config, {
      compatWith: '5.6'
    });
  },
});

export default {
  plugins: [
    // babel-plugin-debug-macros is temporarily needed
    // to convert deprecation/warn calls into console.warn
    [
      'babel-plugin-debug-macros',
      {
        flags: [],

        debugTools: {
          isDebug: true,
          source: '@ember/debug',
          assertPredicateIndex: 1,
        },
      },
      'ember-data-specific-macros-stripping-test',
    ],
    ...Macros.babelMacros,
  ],
};
```

### Parameters

#### context

`object`

#### appRoot

`string`

#### config

[`WarpDriveConfig`](../types/WarpDriveConfig.md)

### Returns

`void`
