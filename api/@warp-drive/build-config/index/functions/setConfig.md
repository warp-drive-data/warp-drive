---
url: /api/@warp-drive/build-config/index/functions/setConfig.md
---

# &#x20;setConfig()

## Call Signature

```ts
function setConfig(macros, config): void;
```

Defined in: [index.ts:280](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/build-config/src/index.ts#L280)

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
   context, 
   appRoot, 
   config
): void;
```

Defined in: [index.ts:281](https://github.com/warp-drive-data/warp-drive/blob/3f489eba2a77cd849b03466a28c2ff1c9f5c97b6/warp-drive-packages/build-config/src/index.ts#L281)

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
