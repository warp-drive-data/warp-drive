---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/build-config/index/functions/babelPlugin.md
---

# &#x20;babelPlugin()

```ts
function babelPlugin(options): object;
```

Defined in: [index.ts:63](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/build-config/src/index.ts#L63)

Create the Babel plugin for WarpDrive

Note: If your project already uses [@embroider/macros](https://www.npmjs.com/package/@embroider/macros)
then you should use [setConfig](setConfig.md) instead of this function.

## Parameters

### options

[`WarpDriveConfig`](../interfaces/WarpDriveConfig.md)

WarpDrive configuration options

## Returns

`object`

An array of Babel plugins

### gts

```ts
gts: Function[];
```

### js

```ts
js: PluginItem[];
```
