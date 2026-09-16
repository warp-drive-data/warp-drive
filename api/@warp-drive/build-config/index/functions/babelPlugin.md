---
url: /api/@warp-drive/build-config/index/functions/babelPlugin.md
---

# &#x20;babelPlugin()

```ts
function babelPlugin(options): object;
```

Defined in: [index.ts:63](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/build-config/src/index.ts#L63)

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
