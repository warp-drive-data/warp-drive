import { defineConfig } from 'tsdown';

// Standalone config (not @warp-drive/internal-config/tsdown/config.js — that one
// wires Ember/babel plugins that don't apply to a node CLI).
//
// The published CLI must be a single ESM file with a `#!/usr/bin/env node`
// shebang (taken from the entry file) that runs on any platform under plain
// node. `@ast-grep/napi` is the only runtime dependency: tsdown externalizes
// everything in `dependencies` and bundles everything else, so package.json
// dependency placement is the bundling policy.
export default defineConfig({
  entry: { index: './src/cli/index.ts' },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // package.json is "type": "module": keep the bin at dist/index.js
  // (platform: 'node' otherwise defaults fixedExtension -> dist/index.mjs)
  fixedExtension: false,
  dts: false,
  sourcemap: false,
  minify: false,
  clean: true,
  outputOptions: {
    // single-file output: inline the lazily-imported codemod implementations
    codeSplitting: false,
  },
});
