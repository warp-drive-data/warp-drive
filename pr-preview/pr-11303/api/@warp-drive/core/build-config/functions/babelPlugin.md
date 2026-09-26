---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11303/api/@warp-drive/core/build-config/functions/babelPlugin.md
description: >-
  Creates the Babel plugins that apply a WarpDrive build config, for projects
  not already using `@embroider/macros`.
---

# &#x20;babelPlugin()

```ts
function babelPlugin(options: WarpDriveConfig): {
  gts: Function[];
  js: PluginItem[];
};
```

Defined in: [warp-drive-packages/build-config/src/index.ts:31](https://github.com/warp-drive-data/warp-drive/blob/6a0f52f3db568b4389b2d95a71d94f0ddfce2d26/warp-drive-packages/build-config/src/index.ts#L31)

Create the Babel plugin for WarpDrive

Note: If your project already uses [@embroider/macros](https://www.npmjs.com/package/@embroider/macros)
then you should use [setConfig](setConfig.md) instead of this function.

## Parameters

### options

[`WarpDriveConfig`](../types/WarpDriveConfig.md)

WarpDrive configuration options

## Returns

```ts
{
  gts: Function[];
  js: PluginItem[];
}
```

An array of Babel plugins

### gts

```ts
gts: Function[];
```

### js

```ts
js: PluginItem[];
```
