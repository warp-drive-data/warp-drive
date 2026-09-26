---
url: /api/@warp-drive/build-config/index/functions/babelPlugin.md
---

# &#x20;babelPlugin()

```ts
function babelPlugin(options: WarpDriveConfig): {
  gts: Function[];
  js: PluginItem[];
};
```

Defined in: [index.ts:63](https://github.com/warp-drive-data/warp-drive/blob/7340b5caea35a9173f2dcd97aba0be5b3c29e7c1/warp-drive-packages/build-config/src/index.ts#L63)

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
