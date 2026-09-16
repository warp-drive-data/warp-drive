---
url: /api/@warp-drive/core/build-config/functions/babelPlugin.md
---

# &#x20;babelPlugin()

```ts
function babelPlugin(options): object;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/index.d.ts:41](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/index.d.ts#L41)

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
